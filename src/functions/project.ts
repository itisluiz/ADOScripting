import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { invokeHandler } from "../util/handlerUtil";
import { projectHandler } from "../handlers/projectHandler";

async function project(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	return await invokeHandler(projectHandler, request, context);
}

app.http("project", {
	methods: ["GET", "POST", "DELETE"],
	authLevel: "function",
	handler: project,
});
