import { UnzipStreamConsumer } from "unzip-stream-dependless";
import { CompressionMethod } from "../src/enums";

// Fetch ZIP file: 47MB
const response = await fetch('https://www.minecraft.net/bedrockdedicatedserver/bin-win-preview/bedrock-server-1.21.90.25.zip');

// Check for response
if(!response.ok || !response.body)
    throw new ReferenceError("Endpoint file not available");

// Extract files while downloading, using Deno runtime
await response.body.pipeTo(new UnzipStreamConsumer({
    async onFile(report, readable){
        if(report.path.endsWith(".json")) console.log(report.path,await new Response(readable).text());
    },
    pipeThrough(report, readable){
        // Handle edge cases for different compressions or custom transform streams in general
        if(report.compressionMethod === CompressionMethod.Deflate)
            return readable.pipeThrough(new DecompressionStream("deflate-raw"))

        return readable;
    }
}))