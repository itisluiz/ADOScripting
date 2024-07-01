import { HandlingError } from "../errors/handlingError";
import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { neatStack } from "./debugUtil";

export async function invokeHandler(
	handler: (request: HttpRequest, context: InvocationContext) => Promise<HttpResponseInit>,
	request: HttpRequest,
	context: InvocationContext,
): Promise<HttpResponseInit> {
	try {
		return await handler(request, context);
	} catch (error) {
		let status = error instanceof HandlingError ? error.status : 500;
		let errorMessage =
			error instanceof HandlingError && !error.sensitive ? error.message : "An internal error has ocurred";
		let failureLogger = (status >= 500 && status < 600 ? context.error : context.warn).bind(context);

		failureLogger("Handler", handler.name, "failed with", `"${error}"`, neatStack(error));

		return {
			status: status,
			jsonBody: {
				error: errorMessage,
			},
		};
	}
}
