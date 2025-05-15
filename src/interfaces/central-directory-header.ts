export interface CentralDirectoryHeader {
    versionMadeBy: number;         // ZIP version that created this entry
    versionNeeded: number;         // Minimum ZIP version needed to extract
    bitFlags: number;              // General-purpose bit flags
    compressionMethod: number;     // Compression method (e.g., Deflate = 8)
    time: number;                  // File modification time
    date: number;                  // File modification date
    crc: number;                   // CRC32 checksum of uncompressed data
    compressedSize: number;        // Size of compressed data
    uncompressedSize: number;      // Size of uncompressed data
    nameLength: number;            // Length of the file name
    extraDataLength: number;       // Length of the extra field
    commentLength: number;         // Length of the file comment
    diskNumberStart: number;       // Disk number where file starts
    internalAttributes: number;    // Internal file attributes
    externalAttributes: number;    // External file attributes
    offsetLocalHeader: number;     // Offset to Local File Header
}