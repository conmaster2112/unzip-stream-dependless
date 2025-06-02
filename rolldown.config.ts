import {RolldownOptions} from "rolldown";
import {devDependencies, main} from "./package.json" with {type: "json"};

const external = new RegExp(`^(node:|${[...Object.getOwnPropertyNames(devDependencies)].join("|")})`);

export default [
    {
        external,
        input: "src/index.ts",
        output: {
            file: main,
        },
        keepNames: true,
    },
    {
        external,
        input: "tests/main.ts",
        output: {
            file: "dist/test.js",
        },
        keepNames: true,
    },
    {
        external,
        input: "nbt/main.ts",
        output: {
            file: "./dist/nbt.js"
        }
    }
] satisfies RolldownOptions[];