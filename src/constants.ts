export const MAX_FILENAME_SIZE = 256*2;
export const MAX_REQUESTED_SIZE = 256;
export const BUFFER_SIZE = 16384 + MAX_REQUESTED_SIZE; // For more accurate chunking
export const UTF8_DECODER = new TextDecoder("utf-8");

export const LOCAL_FILE_HEADER_SIZE = 30 - 4;
export const DATA_DESCRIPTOR_SIZE = 16 - 4;
export const CENTRAL_DIRECTORY_HEADER_SIZE = 46 - 4;
export const END_OF_CENTRAL_DIRECTORY_HEADER_SIZE = 22 - 4;

export const ZIP64_END_OF_CENTRAL_DIRECTORY_HEADER_SIZE = 56 - 4;
export const ZIP64_DATA_DESCRIPTOR_SIZE = 24 - 4;
export const ZIP64_END_OF_CENTRAL_DIRECTORY_LOCATOR_SIZE = 20 - 4;