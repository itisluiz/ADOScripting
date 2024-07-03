import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { invokeHandler } from "../util/handlerUtil";
import { scriptHandler } from "../handlers/scriptHandler";

async function script(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	return await invokeHandler(scriptHandler, request, context);
}

app.http("script", {
	methods: ["GET", "POST", "DELETE"],
	authLevel: "function",
	handler: script,
});
