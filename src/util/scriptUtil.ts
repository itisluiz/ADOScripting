import { Logger } from "../interfaces/logger";
import { neatStack } from "./debugUtil";
import { WebApi } from "azure-devops-node-api";

const AsyncFunction = async function () {}.constructor;

export async function invokeScript(
	script: string,
	_payload: unknown,
	_devops: { organization: WebApi; deployment: WebApi },
	_logger: Logger,
): Promise<string> {
	try {
		_logger.info("Execution started");
		const scriptFunction = AsyncFunction("_payload", "_devops", "_logger", script);
		await scriptFunction(_payload, _devops, _logger);
		_logger.info("Execution succeeded");
		return "OK";
	} catch (error) {
		const errorMessage = error instanceof Error ? `(${error.name}) ${error.message}` : error;
		_logger.warn("Execution failed:", errorMessage, neatStack(error));
		return `ERR: ${errorMessage}`;
	}
}
