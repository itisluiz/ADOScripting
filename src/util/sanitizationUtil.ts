function getExtension(fileName: string): string {
	return fileName.substring(fileName.lastIndexOf(".") + 1);
}

function removeExtension(fileName: string): string {
	return fileName.substring(0, fileName.lastIndexOf("."));
}

export function sanitizeFileName(fileName: string, extension: string | undefined = undefined): string {
	let sanitizedFileName = fileName.replace(/[^\w.-]+/g, "");

	if (extension !== undefined && getExtension(sanitizedFileName) !== extension) {
		sanitizedFileName = removeExtension(sanitizedFileName) + `.${extension}`;
	}

	return sanitizedFileName;
}
