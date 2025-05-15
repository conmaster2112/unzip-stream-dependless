export enum ExtraFieldId {
    Zip64 = 0x0001,                 // ZIP64 extended information // 0x08074b50
    ExtendedTimestamp = 0x5455,      // Extended timestamp field
    NTFS = 0x000A,                   // NTFS timestamps
    StrongEncryption = 0x0017,       // Strong encryption field (PKWare)
    UnixUIDGID = 0x7855,             // UNIX UID/GID metadata
    UnicodeFileName = 0x756E,        // Unicode filename field
    UnicodeComment = 0x6375,         // Unicode comment field
    UTF8FileName = 0x7075,           // Alternative UTF-8 path field
    AES = 0x9901,                    // AES encryption metadata
    OS2ExtendedAttributes = 0x4F4C,  // OS/2 extended attributes
    MacOSXMetadata = 0x07C8,         // Mac OS X metadata
    CentralDirectoryProtection = 0x4341, // CA central directory protection
    X509CertificatePKCS7 = 0x0014,   // X.509 certificate (PKCS#7 format)
    X509CertificatePKCS7Attributes = 0x0015, // X.509 certificate attributes
    X509CertificatePKCS1RSA = 0x0016, // X.509 certificate PKCS#1 RSA encrypted
    WavPack = 0x100,                 // WavPack lossless audio compression
    PPMdVersionI = 0x101,            // PPMd compressed data
    IBMTERSE = 0x0018,               // IBM TERSE format
}