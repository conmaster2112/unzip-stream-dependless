export * from "./magic";
export * from "./extra-field-id";
export * from "./compression-method";

export enum ExpectedState {
    LocalFileHeader,
    FileName,
    FileExtraField,
    FileContent,
    CentralDirectory,
    EndOfCentralDirectory,
}