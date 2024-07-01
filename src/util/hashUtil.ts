import { createHash } from "crypto";

function hash(algorithm: string = "md5", ...text: string[]) {
	const hash = createHash(algorithm).update(text.sort().join()).digest("hex");
	return hash;
}

export function md5(...text: string[]) {
	return hash("md5", ...text);
}
