export enum NBTTag {
    EndOfCompound = 0x00,
    Byte = 0x01,
    Int16 = 0x02,
    Int32 = 0x03,
    Int64 = 0x04,
    Float32 = 0x05,
    Float64 = 0x06,
    ByteArray = 0x07,
    String = 0x08,
    List = 0x09,
    Compound = 0x0A,
    Int32Array = 0x0B,
    Int64Array = 0x0C,

}
export interface NBTFormatProvider {
    readType(): NBTTag;
    readStringLength(): number;
    readListLength(): number;
    [NBTTag.Byte](): number;0
    [NBTTag.Int16](): number;
    [NBTTag.Int32](): number;
    [NBTTag.Int64](): bigint;
    [NBTTag.Float32](): number;
    [NBTTag.Float64](): number;
    [NBTTag.ByteArray](): Uint8Array;
    [NBTTag.String](): string;
    [NBTTag.List](): unknown[];
    [NBTTag.Compound](): object;
    [NBTTag.Int32Array](): Int32Array;
    [NBTTag.Int64Array](): BigInt64Array;
}