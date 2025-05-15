import {RolldownOptions} from "rolldown";
import {devDependencies, main} from "./package.json" with {type: "json"};

const external = new RegExp(`^(node:|${[...Object.getOwnPropertyNames(devDependencies)].join("|")})`);

console.log(external);
export default [
    {
        external,
        input: "src/index.ts",
        output: {
            file: main, 
            minify: true,
        },
        keepNames: true,
    },
    {
        external,
        input: "tests/main.ts",
        output: {
            file: "dist/test.js", 
            minify: true,
        },
        keepNames: true,
    }
] satisfies RolldownOptions[];