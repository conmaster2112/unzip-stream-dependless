# unzip-web-stream
Streaming cross-platform & cross-runtime unzip tool written to match EcmaScript features and patterns

This package is ES replacement for ["unzip-stream"](https://www.npmjs.com/package/unzip-stream) (its own rewrite from ground) and provides simple APIs for parsing ZIP Structures and extracting zip files. It uses latest WebAPI Stream patterns from **ES8** which allows it to use in every runtime environment following **ES8 Web Stream** standards. There are zero dependencies - inflation is handled in default by **WebAPIs DecompressionStream** transformer.

### Notice
> Keep in mind that the zip file format isn't inherently designed for streaming. While this library should work in most cases, if you have a complete zip file available, it's better to use libraries specifically built to read zip archives from the end, as originally intended—such as yauzl or decompress-zip.

### Installation
```properties
npm install unzip-web-stream
```

## Quick Examples
### Streaming ZIP Extraction in Deno

This example demonstrates how to **download and extract files from a ZIP archive** while download streaming, using the [`unzip-web-stream`](https://www.npmjs.com/package/unzip-web-stream) library.

- Fetches a large ZIP file from an external source.
- Checks for a valid response before proceeding.
- **Extracts files and directories on-the-fly**, writing them directly using Deno's filesystem API.

Ideal for **processing large ZIP files efficiently** without needing to load the entire archive into memory.

```ts
import {UnzipStreamConsumer} from "unzip-web-stream";

// Fetch ZIP file: 47MB
const response = await fetch('https://www.minecraft.net/bedrockdedicatedserver/bin-win-preview/bedrock-server-1.21.90.25.zip');

// Check for response
if(!response.ok || !response.body)
    throw new ReferenceError("Endpoint file not available");

// Extract files while downloading, using Deno runtime
await response.body.pipeTo(new UnzipStreamConsumer({
    async onFile(report, readable){
        const {path} = report;

        // Open new file handle and pipe readable stream there
        const fileHandle = await Deno.open(path, {write: true, create: true});
        readable.pipeTo(fileHandle.writable);
    },
    // Synced because directory must me always created before files
    onDirectory(report){ Deno.mkdirSync(report.path) }
}))
```
### Custom Compression Handling in ZIP Extraction
This method is useful for two main cases:
 - Non-standard decompression – Allows handling custom compression formats beyond typical ZIP extraction.
 - Additional transformations – Enables further processing on extracted files before saving.
This makes the pipeline flexible, supporting both special decompression methods and custom file manipulations during extraction.
```js
await readable.pipeTo(new UnzipStreamConsumer({
    async onFile(report, readable){
        const {path} = report;

        // Open new file handle and pipe readable stream there
        const fileHandle = await Deno.open(path, {write: true, create: true});
        readable.pipeTo(fileHandle.writable);
    },

    // Thats how default build-in pipe transformer looks like, once you use pipeThrough you have to cover right compression method on your own
    pipeThrough(report, readable){
        // Handle edge cases for different compressions or custom transform streams in general
        if(report.compressionMethod === CompressionMethod.Deflate)
            return readable.pipeThrough(new DecompressionStream("deflate-raw"))

        return readable;
    }
}))
```