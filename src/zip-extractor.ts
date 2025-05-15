import { BufferSlice, Reader, StreamDataProvider } from "./stream-data-provider";
import type { EndOfCentralDirectoryHeader, ExtraDataHeader, EntryReport, LocalFileHeader, Zip64EndOfCentralDirectoryLocator } from "./interfaces";
import { MagicNumber } from "./enums";
import { BUFFER_SIZE, CENTRAL_DIRECTORY_HEADER_SIZE, END_OF_CENTRAL_DIRECTORY_HEADER_SIZE, LOCAL_FILE_HEADER_SIZE, MAX_FILENAME_SIZE, MAX_REQUESTED_SIZE, UTF8_DECODER } from "./constants";
import { ExtraDataParser } from "./extra-data-parser";
import { CentralDirectoryHeader } from "./interfaces/central-directory-header";
import { ZipBitFlags } from "./enums/bit-flags";

export class ZipStreamExtractor extends StreamDataProvider {
    public static readonly textDecoder = new TextDecoder();
    public onFileRead?: (report: EntryReport, stream: ReadableStream<BufferSlice>)=>void
    public onDirectoryInfo?: (report: EntryReport)=>void
    public constructor(
        protected readonly parser: ExtraDataParser = new ExtraDataParser(),
        protected readonly buffer: ArrayBuffer = new ArrayBuffer(BUFFER_SIZE)) {
        super(MAX_REQUESTED_SIZE, buffer);
    }
    protected * getProgram(): Generator<number, void, number> {
        while (true) {
            const available = yield 4;
            if(available < 4) throw new SyntaxError("Unexpected end of input")

            const magic = this.getMagic();
            this.reader.movePointer(4);
            if (typeof this[magic] !== "function")
                throw new Error("Unexpected magic number: " + magic.toString(16) + " " + MagicNumber[magic]);

            // Run correct data processor
            const endExpected = yield* this[magic]();
            if(endExpected) {
                yield -1;
                return;
            }
        }
    }
    protected *[MagicNumber.EndOfCentralDirectory](): Generator<number, true, number> {
        const headerSize = yield END_OF_CENTRAL_DIRECTORY_HEADER_SIZE;
        if (headerSize < END_OF_CENTRAL_DIRECTORY_HEADER_SIZE)
            throw new Error("Invalid EndOfCentralDirectoryHeader size: " + headerSize);

        const header = BatchReadHelpers.readEndOfCentralDirectoryHeader(this.reader);

        // Skip comment
        yield * this.reader.batchSkip(header.commentLength);

        // End expected
        return true;
    }
    protected *[MagicNumber.CentralDirectoryHeader](): Generator<number, any, number> {
        const headerSize = yield CENTRAL_DIRECTORY_HEADER_SIZE;
        if (headerSize < CENTRAL_DIRECTORY_HEADER_SIZE)
            throw new Error("Invalid CentralDirectoryHeader size: " + headerSize);

        const header = BatchReadHelpers.readCentralDirectoryHeader(this.reader);
        yield * this.reader.batchSkip(header.nameLength);
        yield * this.reader.batchSkip(header.extraDataLength);
        yield * this.reader.batchSkip(header.commentLength);
    }
    protected *[MagicNumber.LocalFileHeader](): Generator<number, any, number> {
        // Read up whole header data
        const headerSize = yield LOCAL_FILE_HEADER_SIZE;
        if (headerSize < LOCAL_FILE_HEADER_SIZE) return void console.error("Invalid header size");
        const header = BatchReadHelpers.readLocalFileHeader(this.reader);

        // Read File Name
        if (header.nameLength > MAX_FILENAME_SIZE)
            throw new Error("File name path is too long: " + header.nameLength);

        if ((yield header.nameLength) < header.nameLength)
            throw new Error("Unexpected end of input");

        const path = UTF8_DECODER.decode(this.reader.rentSlice(header.nameLength));

        // Build partial report
        const report: EntryReport = {
            time: header.time,
            date: header.date,
            compressionMethod: header.compressionMethod,
            bits: header.bitFlags,
            isZIP64: false,
            isStreamSized: (header.bitFlags & ZipBitFlags.HasDataDescriptor) === ZipBitFlags.HasDataDescriptor,
            compressedSize: header.compressedSize,
            uncompressedSize: header.uncompressedSize,
            path: path,
            crc: header.crc,
        }

        // Read up extra data with parsers
        let startingOffset = this.absoluteOffset;
        while ((this.absoluteOffset - startingOffset) < header.extraDataLength) {
            const { id, size } = yield* this.readExtraDataHeader();
            const parser = this.parser.parsers[id];
            if (parser) {
                const data = yield* parser(this.reader, { id, size });
                if (typeof data === "object") Object.assign(report, data);
            }
            else yield* this.reader.batchSkip(size);
        }

        if(report.uncompressedSize === 0 && !report.isStreamSized && report.path.match(/^.*[\\/]{1}$/))
            return void this.onDirectoryInfo?.(report);

        // Mark scope variables
        let readable: ReadableStream;
        let generator: Iterable<number, unknown, number>;

        if (report.isStreamSized){
            const data = this.reader._createStreamController();
            readable = data.readable;
            generator = this.streamReadData(data.controller, report.isZIP64);
        }
        else {
            let _ = generator = this.reader.createReadable(report.compressedSize);
            readable = _.readable;
        }

        this.onFileRead?.(report, readable);
        // Run the data generator reader
        yield* generator;
    }
    protected * streamReadData(controller: ReadableStreamController<BufferSlice>, isZIP64: boolean): Generator<number, void, number> {
        const descriptorSize = isZIP64?(4+4+8+8):(4+4+4+4);
        const readSize = isZIP64?(offset: number)=>Number(this.view.getBigUint64(offset, true)):(offset: number)=>this.view.getUint32(offset, true)
        let offset = 0;
        while (true) {
            const available = yield (descriptorSize + 1), toRead = available - descriptorSize;
            const startingOffset = this.activePointer;
            let i = 0;
            for(; i <= toRead; i++, offset++)
                if(
                    // Check for magic first
                    (this.view.getUint32(startingOffset + i, true) === MagicNumber.DataDescriptor) &&
                    // Check for bytes read and compressedSize
                    (readSize(startingOffset + i + 8) === offset)
                ){
                    //console.log("CRC:", this.view.getUint32(startingOffset + i + 4, true))
                    //console.log("CompressedSize:",readSize(startingOffset + i + 8))
                    // Rent slice already moves the pointer
                    controller.enqueue(this.reader.rentSlice(i));
                    this.reader.movePointer(isZIP64?(8+16):(8+8))
                    controller.close();
                    return;
                }
            // Rent slice already moves the pointer
            controller.enqueue(this.reader.rentSlice(i));
        }
    }
    protected getMagic(): number {
        return this.view.getUint32(this.activePointer, true);
    }
    protected * readExtraDataHeader(): Generator<number, ExtraDataHeader, number> {
        if ((yield 4) < 4)
            throw new Error("Unexpected end of input");

        return {
            id: this.reader.readUint16(),
            size: this.reader.readUint16()
        }
    }
}
export namespace BatchReadHelpers {
    export function readLocalFileHeader(reader: Reader): LocalFileHeader {
        return {
            version: reader.readUint16(),
            bitFlags: reader.readUint16(),
            compressionMethod: reader.readUint16(),
            time: reader.readUint16(),
            date: reader.readUint16(),
            crc: reader.readUint32(),
            compressedSize: reader.readUint32(),
            uncompressedSize: reader.readUint32(),
            nameLength: reader.readUint16(),
            extraDataLength: reader.readUint16()
        }
    }
    export function readCentralDirectoryHeader(reader: Reader): CentralDirectoryHeader {
        // 46bytes
        return {
            versionMadeBy: reader.readUint16(),
            versionNeeded: reader.readUint16(),
            bitFlags: reader.readUint16(),
            compressionMethod: reader.readUint16(),
            time: reader.readUint16(),
            date: reader.readUint16(),
            crc: reader.readUint32(),
            compressedSize: reader.readUint32(),
            uncompressedSize: reader.readUint32(),
            nameLength: reader.readUint16(),
            extraDataLength: reader.readUint16(),
            commentLength: reader.readUint16(),
            diskNumberStart: reader.readUint16(),
            internalAttributes: reader.readUint16(),
            externalAttributes: reader.readUint32(),
            offsetLocalHeader: reader.readUint32()
        };
    }
    export function readEndOfCentralDirectoryHeader(reader: Reader): EndOfCentralDirectoryHeader {
        return {
            diskNumber: reader.readUint16(),
            centralDirectoryDisk: reader.readUint16(),
            centralDirectoryRecordsOnDisk: reader.readUint16(),
            totalCentralDirectoryRecords: reader.readUint16(),
            centralDirectorySize: reader.readUint32(),
            centralDirectoryOffset: reader.readUint32(),
            commentLength: reader.readUint16()
        };
    }
    export function readZIP64CentralDirectoryHeader(reader: Reader): CentralDirectoryHeader {
        return {
            versionMadeBy: reader.readUint16(),
            versionNeeded: reader.readUint16(),
            bitFlags: reader.readUint16(),
            compressionMethod: reader.readUint16(),
            time: reader.readUint16(),
            date: reader.readUint16(),
            crc: reader.readUint32(),
            compressedSize: Number(reader.readBigUint64()),     // ZIP64 uses 64-bit sizes
            uncompressedSize: Number(reader.readBigUint64()),   // ZIP64 uses 64-bit sizes
            nameLength: reader.readUint16(),
            extraDataLength: reader.readUint16(),
            commentLength: reader.readUint16(),
            diskNumberStart: reader.readUint32(),       // ZIP64 extends disk number to 32-bit
            internalAttributes: reader.readUint16(),
            externalAttributes: reader.readUint32(),
            offsetLocalHeader: Number(reader.readBigUint64())   // ZIP64 uses 64-bit offsets
        };
    }
    export function readZip64EndOfCentralDirectoryLocator(reader: Reader): Zip64EndOfCentralDirectoryLocator {
        return {
            diskWithEOCD: reader.readUint32(),
            offsetEOCD: reader.readBigUint64(),  // 64-bit offset
            totalDisks: reader.readUint32()
        };
    }
}