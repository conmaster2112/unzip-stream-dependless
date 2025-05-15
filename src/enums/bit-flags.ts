export enum ZipBitFlags {
    Encrypted = 0x0001,              // File is encrypted
    CompressionOption1 = 0x0002,     // Compression option (depends on method)
    CompressionOption2 = 0x0004,     // Compression option (depends on method)
    HasDataDescriptor = 0x0008,      // Uses Data Descriptor (size & CRC stored after data)
    ReservedPkware1 = 0x0010,        // Reserved by PKWare
    StrongEncryption = 0x0020,       // Strong encryption (instead of standard ZIP encryption)
    UTF8Encoding = 0x0800,           // File name & comment are UTF-8 encoded
    MaskHeaderValues = 0x2000        // Indicates encrypted Central Directory
}