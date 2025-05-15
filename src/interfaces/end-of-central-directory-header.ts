export interface EndOfCentralDirectoryHeader {
    diskNumber: number;                  // Disk number containing this record
    centralDirectoryDisk: number;        // Disk number where central directory starts
    centralDirectoryRecordsOnDisk: number;  // Number of entries in the central directory for this disk
    totalCentralDirectoryRecords: number;  // Total number of entries in central directory
    centralDirectorySize: number;        // Size of the central directory
    centralDirectoryOffset: number;      // Offset where central directory starts
    commentLength: number;               // Length of ZIP file comment
}