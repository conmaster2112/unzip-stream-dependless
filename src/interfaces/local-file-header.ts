export interface LocalFileHeader {
    version: number;
    bitFlags: number;
    compressionMethod: number;
    time: number;
    date: number;
    crc: number;
    compressedSize: number;
    uncompressedSize: number;
    nameLength: number;
    extraDataLength: number
}