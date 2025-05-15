import { CompressionMethod } from "./enums";
import { EntryReport } from "./interfaces";
import { BufferSlice } from "./stream-data-provider";
import { ZipStreamExtractor } from "./zip-extractor";

export class UnzipStreamConsumer extends WritableStream<Uint8Array> {
    protected readonly unzipExtractor: ZipStreamExtractor;
    protected readonly transformer = new TransformStream();
    public constructor(options?: UnzipStreamConsumerOptions){
        super({
            abort: (e)=>writer.abort(e),
            close: ()=>writer.close(),
            write: (chunk)=>writer.write(chunk),
        });
        this.unzipExtractor = options?.zipExtractor??new ZipStreamExtractor();
        const writer = this.transformer.writable.getWriter();
        this.unzipExtractor.consume(this.transformer.readable).catch(e=>{
            console.error("Abort:", e)
            writer.abort(e);
        });
        this.unzipExtractor.onFileRead = (r, s)=>options?.onFile?.(r, options?.pipeThrough?.(r, s)??fallbackPipeThrough(r, s));
        this.unzipExtractor.onDirectoryInfo = (r)=>options?.onDirectory?.(r);
        const fallbackPipeThrough = (report: EntryReport, readable: ReadableStream<BufferSlice>): ReadableStream<BufferSlice> => {
            if(report.compressionMethod === CompressionMethod.Deflate) return readable.pipeThrough(new DecompressionStream("deflate-raw"));
            return readable;
        }
    }
}
export interface UnzipStreamConsumerOptions {
    zipExtractor?: ZipStreamExtractor;
    onFile?(report: EntryReport, readable: ReadableStream<BufferSlice>): void;
    pipeThrough?(report: EntryReport, readable: ReadableStream<BufferSlice>): ReadableStream<BufferSlice>;
    onDirectory?(report: EntryReport): void
}