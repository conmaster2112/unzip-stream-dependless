export enum CompressionMethod {
    Store = 0,          // No compression
    Shrink = 1,         // LZW compression
    Reduce1 = 2,        // Huffman coding (Factor 1)
    Reduce2 = 3,        // Huffman coding (Factor 2)
    Reduce3 = 4,        // Huffman coding (Factor 3)
    Reduce4 = 5,        // Huffman coding (Factor 4)
    Implode = 6,        // Dictionary + Huffman encoding
    Deflate = 8,        // Standard Deflate compression
    Deflate64 = 9,      // Extended Deflate compression
    PKWareImplode = 10, // PKWare-specific compression
    BZIP2 = 12,         // BZIP2 compression
    LZMA = 14,         // LZMA compression (used in 7z)
    IBMTERSE_Old = 16, // IBM TERSE (older format)
    IBMLZ77 = 17,      // IBM LZ77 compression
    PPMd = 18,         // PPMd compression, optimized for text
    IBMTERSE_New = 19, // Updated IBM TERSE format
    ZStandard = 93,    // Zstandard compression
    XZ = 98,           // XZ compression based on LZMA
    JPEG = 99,         // Specialized JPEG compression
    WavPack = 100,     // Lossless audio compression
    PPMdVersionI = 101,// Enhanced PPMd compression
    AES = 102          // AES-encrypted file storage
}