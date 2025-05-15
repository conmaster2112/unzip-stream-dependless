import { MAX_FILENAME_SIZE, UTF8_DECODER } from "./constants";
import { ExtraFieldId } from "./enums";
import { ExtraDataHeader } from "./interfaces";
import { EntryReport } from "./interfaces/file-report";
import { Reader } from "./stream-data-provider";


export type ExtraDataParserFunction<T extends object> = (reader: Reader, info: ExtraDataHeader)=>Iterable<number, T, number>
export class ExtraDataParser<T = {}>{
    public readonly parsers: Record<number, ExtraDataParserFunction<any>>
    public constructor(){
        this.parsers = Object.create(DEFAULT_PARSERS);
    }
    public registryParser<S extends object>(id: number, parser: ExtraDataParserFunction<S>): ExtraDataParser<Partial<S> & T>
    {
        this.parsers[id] = parser;
        return this as ExtraDataParser<T & S>;
    }
}
export const DEFAULT_PARSERS = {
    *[ExtraFieldId.UnicodeFileName](reader, info){
        yield 1; // Ensures at least 1 byte is available to read
        const version = reader.readUint8();
        if(version != 1) return;
        yield 4; // Ensures at least 4 bytes are available to read
        const _crc = reader.readUint32();
        const fileNameSize = info.size - 5;

        // max filename check
        if(fileNameSize > MAX_FILENAME_SIZE)
            throw new Error("File name too long, bytes: " + fileNameSize);

        // Dynamic buffer load based on its size
        const textBuffer = yield * reader.bufferUp(new Uint8Array(fileNameSize));

        // Update fileName
        return {
            path: UTF8_DECODER.decode(textBuffer)
        } satisfies Partial<EntryReport>;
    },
    *[ExtraFieldId.UTF8FileName](reader, info){
        yield 1; // Ensures at least 1 byte is available to read
        const version = reader.readUint8();
        if(version != 1) return;
        const fileNameSize = info.size - 1;

        // max filename check
        if(fileNameSize > MAX_FILENAME_SIZE)
            throw new Error("File name too long, bytes: " + fileNameSize);

        // Dynamic buffer load based on its size
        const textBuffer = yield * reader.bufferUp(new Uint8Array(fileNameSize));

        // Update fileName
        return {
            path: UTF8_DECODER.decode(textBuffer)
        } satisfies Partial<EntryReport>;
    },

    *[ExtraFieldId.Zip64](reader) {
        console.log("Zip64");
        yield 8; // Ensure space for size fields
        const uncompressedSize = Number(reader.readBigUint64());
        const compressedSize = Number(reader.readBigUint64());

        return {
            uncompressedSize,
            compressedSize
        } satisfies Partial<EntryReport>;
    },

    *[ExtraFieldId.ExtendedTimestamp](reader) {
        yield 1; // Ensure at least 1 byte is available to read
        const flags = reader.readUint8();
        const _: Partial<EntryReport> = {};

        if (flags & 0x01) {
            yield 4;
            _.modificationTime = reader.readUint32();
        }
        if (flags & 0x02) {
            yield 4;
            _.accessTime = reader.readUint32();
        }
        if (flags & 0x04) {
            yield 4;
            _.creationTime = reader.readUint32();
        }

        return _;
    },
} satisfies Record<number, ExtraDataParserFunction<any>>;