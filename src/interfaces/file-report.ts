export interface EntryReport {
    time: number;
    date: number;
    compressionMethod: number;
    bits: number;
    isZIP64: boolean;
    isStreamSized: boolean;
    compressedSize: number;
    uncompressedSize: number;
    path: string;
    modificationTime?: number;
    accessTime?: number;
    creationTime?: number;
    crc: number;
}