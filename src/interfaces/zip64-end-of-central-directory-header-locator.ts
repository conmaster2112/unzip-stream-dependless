export interface Zip64EndOfCentralDirectoryLocator {
    diskWithEOCD: number;       // Disk where ZIP64 EOCD is located
    offsetEOCD: bigint;         // 64-bit offset pointing to ZIP64 EOCD
    totalDisks: number;         // Total number of disks in the ZIP archive
}