export function neatStack(error: any, maxLines: number = 8): string {
	let stackTrace: string[] = ["\nStack trace ----------------------------------------------------------------"];

	if (!(error instanceof Error) || !error.stack) {
		stackTrace.push("No stack trace available");
	} else {
		let stack = error.stack.split("\n");
		stack = stack.filter((line) => line.match(/^\s+at/));
		stack = stack.slice(1, maxLines + 1);
		stack = stack.map((line, index) => line.replace(/^\s+at/, index === 0 ? "[throw]" : `[-${index}]`));
		stackTrace = stackTrace.concat(stack);
	}

	stackTrace.push("-".repeat(stackTrace[0].length));
	return stackTrace.join("\n");
}
