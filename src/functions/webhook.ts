import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { invokeHandler } from "../util/handlerUtil";
import { webhookHandler } from "../handlers/webhookHandler";

async function webhook(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	return await invokeHandler(webhookHandler, request, context);
}

app.http("webhook", {
	methods: ["POST"],
	authLevel: "function",
	handler: webhook,
});
