import { UnzipStreamConsumer } from "unzip-stream-dependless";
import {Unzip} from "fflate";
// Fetch ZIP file: 47MB
const response = await fetch('https://www.minecraft.net/bedrockdedicatedserver/bin-win-preview/bedrock-server-1.21.90.25.zip');

// Check for response
if(!response.ok || !response.body)
    throw new ReferenceError("Endpoint file not available");

const t = performance.now();
/*
const unzipper = new Unzip();
unzipper.onfile = (e)=>console.log(e.name);
for await(const chunk of response.body){
    unzipper.push(chunk);
}
unzipper.push(new Uint8Array(0), true);
*/
// Extract files while downloading, using Deno runtime
await response.body.pipeTo(new UnzipStreamConsumer({
    async onFile(report, _){
        console.log(report.path, report.path);
    }
}))

console.log(performance.now() - t);