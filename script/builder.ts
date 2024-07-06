import * as fs from "fs";
import { script, scriptPath } from "./script";

export function getScriptBody() {
	const scriptBody = script.toString();
	let scriptLines = scriptBody.slice(scriptBody.indexOf("{") + 1, scriptBody.lastIndexOf("}")).split("\n");
	scriptLines = scriptLines.filter((line) => line.trim().length > 0);
	scriptLines = scriptLines.map((line) => line.replace(/ {4}/g, "\t").replace(/^\t/, ""));

	return scriptLines.join("\n") + "\n";
}

if (require.main === module) {
	fs.writeFileSync(scriptPath, getScriptBody());
	console.log(`Script saved to '${scriptPath}'`);
}
