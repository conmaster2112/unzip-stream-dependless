
interface StreamDataProviderReader {
     createStreamController<T>(): {readable: ReadableStream<T>, controller: ReadableStreamController<T>}
  createReadable(length: number): Generator<number, void, number> & {
    readable: ReadableStream<BufferSlice>;
  };
  bufferUp<T extends BufferSlice>(buffer: T): Generator<number, T, number>;
  batchSkip(length: number): Generator<number, void, number>;
  movePointer(length: number): void;
  rentSlice(length: number): BufferSlice;
  readUint8(): number;
  readUint16(): number;
  readUint32(): number;
  readBigUint64(): bigint;
  rentDataView(length: number): DataView<ArrayBuffer>;
  bufferUpController(controller: ReadableStreamController<BufferSlice>, length: number, close?: boolean): Generator<number, void, number>
}

export type Reader = StreamDataProviderReader;

export type BufferSlice = Uint8Array<ArrayBuffer>;

export abstract class StreamDataProvider {
    public static ReaderConstructor: new (_: StreamDataProvider)=>StreamDataProviderReader = class Readable {
        public constructor(
            protected readonly dataProvider: StreamDataProvider) {
        }
        public createStreamController<T>(): {readable: ReadableStream<T>, controller: ReadableStreamController<T>}{
            let controller: ReadableStreamController<T>;
            const readable = new ReadableStream<T>({start(c) {controller = c}});
            return {
                controller: controller!,
                readable
            }
        }
        public * bufferUpController(controller: ReadableStreamController<BufferSlice>, length: number, close: boolean = true): Generator<number, void, number>{
            let offset = 0;
            while (offset < length) {
                const available = yield 1;
                let toRead = Math.min(available, (length - offset));
                if (toRead === 0)
                    break;
                controller.enqueue(this.rentSlice(toRead));
                offset += toRead;
            }
            if(close)
                controller.close();
        }
        public createReadable(length: number): (Generator<number, void, number> & {readable: ReadableStream<BufferSlice>}){
            const {controller, readable} = this.createStreamController<BufferSlice>();
            const generator = this.bufferUpController(controller, length);
            (generator as (Generator<number, void, number> & {readable: ReadableStream<BufferSlice>})).readable = readable;
            return generator as (Generator<number, void, number> & {readable: ReadableStream<BufferSlice>});
        }
        public * bufferUp<T extends BufferSlice>(buffer: T): Generator<number, T, number> {
            let offset = 0;
            while (offset < buffer.length) {
                const available = yield 1;
                let toRead = Math.min(available, (buffer.length - offset));
                if (toRead === 0) return buffer;
                buffer.set(this.rentSlice(toRead), offset);
                offset += toRead;
            }
            return buffer;
        }
        public * batchSkip(length: number): Generator<number, void, number> {
            let offset = 0;
            while (offset < length) {
                const available = yield 1;
                let toRead = Math.min(available, (length - offset));
                if (toRead === 0) return;
                this.movePointer(toRead);
                offset += toRead;
            }
        }
        public movePointer(length: number): void { this.dataProvider.moveActivePointer(length); }
        public rentSlice(length: number): BufferSlice {
            const _ = this.dataProvider.u8Array.slice(this.dataProvider.activePointer, this.dataProvider.activePointer + length);
            this.movePointer(length);
            return _;
        }
        public readUint8(): number {
            const _ = this.dataProvider.view.getUint8(this.dataProvider.activePointer);
            this.movePointer(1);
            return _;
        }
        public readUint16(): number {
            const _ = this.dataProvider.view.getUint16(this.dataProvider.activePointer, true);
            this.movePointer(2);
            return _;
        }
        public readUint32(): number {
            const _ = this.dataProvider.view.getUint32(this.dataProvider.activePointer, true);
            this.movePointer(4);
            return _;
        }
        public readBigUint64(): bigint {
            const _ = this.dataProvider.view.getBigUint64(this.dataProvider.activePointer, true);
            this.movePointer(8);
            return _;
        }
        public rentDataView(length: number): DataView<ArrayBuffer> {
            const _ = new DataView(this.dataProvider.buffer, this.dataProvider.view.byteOffset + this.dataProvider.activePointer, length);
            this.movePointer(length);
            return _;
        }
    }
    public readonly reader: StreamDataProviderReader = new StreamDataProvider.ReaderConstructor(this);
    // DataView and BufferSlice for buffer manipulation
    protected readonly view: DataView;
    protected readonly u8Array: BufferSlice;
    // Pointers to track active data within the buffer
    protected absoluteOffset = 0;
    private _activePointer = 0;
    protected get activePointer(): number { return this._activePointer; }
    protected moveActivePointer(offset: number): void {
        this._activePointer += offset;
        this.absoluteOffset += offset;
    }
    protected activeLength: number = 0;
    protected maxSubChunkSize: number;
    // Flag to check if the consumer is running
    private isRunning: boolean = false;

    // Constructor to initialize buffer and DataView
    public constructor(
        protected readonly maxRequestedSize: number,
        protected readonly buffer: ArrayBuffer) {
        this.view = new DataView(this.buffer);
        this.u8Array = new Uint8Array(this.buffer);
        this.maxSubChunkSize = buffer.byteLength - maxRequestedSize
    }

    // Abstract method to get the program iterator
    protected abstract getProgram(): Iterator<number, unknown, number>;

    // Method to consume data from a readable stream
    public async consume(readable: AsyncIterable<BufferSlice>): Promise<void> {
        if (this.isRunning) throw new ReferenceError("Each consumer instance can run only one task at the time. You can reset this instance and run next task once current task quits.");
        return void await this.process(readable).finally(() => this.isRunning = false);
    }

    // Private method to process the readable stream
    private async process(_readable: AsyncIterable<BufferSlice>): Promise<void> {
        this.isRunning = true; // Mark the consumer as running
        const program = this.getProgram(); // Get the program iterator
        let requested = 0; // Initialize the requested size
        let endRequested = false;
        // Iterate over chunks from the readable stream
        for await (const raw_chunk of _readable)
            // Split the raw chunk into smaller chunks if necessary
            for (const chunk of StreamDataProvider.getChunkIterator(raw_chunk, this.maxSubChunkSize)) {
                if(endRequested) continue;
                this.flush(); // Flush the buffer to make space for new data
                this.set(chunk); // Set the new chunk into the buffer

                // Process the data in the buffer
                while (requested <= (this.activeLength - this.activePointer)) {
                    const { done, value } = program.next((this.activeLength - this.activePointer)); // Get the next value from the program
                    if (done) return; // Exit if the program is done
                    if ((requested = value) === -1) { // Check if a reset is requested
                        requested = this.activeLength = this._activePointer = 0; // Reset pointers and length
                        endRequested = true;
                        break;
                    }
                }
            }

        let nextValue = program.next((this.activeLength - this.activePointer));
        while (!nextValue.done) nextValue = program.next((this.activeLength - this.activePointer));
    }

    // Method to set data in the buffer
    protected set(u8: BufferSlice): void {
        if (this.activeLength + u8.length > this.buffer.byteLength) throw new Error(`Buffer overflow error, ${this.activeLength}, ${this.buffer.byteLength}, ${u8.length}`);
        this.u8Array.set(u8, this.activeLength);
        this.activeLength += u8.length;
    }

    // Method to flush the buffer
    protected flush(): void {
        if (this.activePointer <= 0 || this.activeLength <= 0) return;
        this.u8Array.set(this.u8Array.subarray(this.activePointer, this.activeLength), 0);
        this.activeLength -= this.activePointer;
        this._activePointer = 0;
    }

    // Method to reset the consumer
    public reset(): void {
        if (this.isRunning) throw new ReferenceError("Instance is locked, you can reset only instance with no tasks running.");
        this.activeLength = 0;
        this._activePointer = 0;
    }

    // Static helper to get chunk iterator
    public static * getChunkIterator(buffer: BufferSlice, chunkLength: number): Generator<BufferSlice> {
        let start = 0;
        while (start < buffer.length) yield buffer.subarray(start, start += chunkLength);
    }
}