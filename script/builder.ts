import * as fs from "fs";
import script from "./script";

const scriptOutPath = "script/builtscript.js";

const scriptBody = script.toString();
let scriptLines = scriptBody.slice(scriptBody.indexOf("{") + 1, scriptBody.lastIndexOf("}")).split("\n");
scriptLines = scriptLines.filter((line) => line.trim().length > 0);
scriptLines = scriptLines.map((line) => line.replace(/ {4}/g, "\t").replace(/^\t/, ""));

fs.writeFileSync(scriptOutPath, scriptLines.join("\n") + "\n");
console.log(`Script saved to '${scriptOutPath}'`);
