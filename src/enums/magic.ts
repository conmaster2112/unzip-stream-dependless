
export enum MagicNumber {
    LocalFileHeader = 0x04034b50,
    CentralDirectoryHeader = 0x02014b50,
    DataDescriptor = 0x08074b50,
    EndOfCentralDirectory = 0x06054b50,
    ZIP64EndOfCentralDirectory = 0x06064B50,
    ZIP64EndOfCentralDirectoryLocator = 0x07064B50
}