import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { invokeHandler } from "../util/handlerUtil";
import { registerProjectHandler } from "../handlers/registerProjectHandler";

async function registerProject(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	return await invokeHandler(registerProjectHandler, request, context);
}

app.http("registerProject", {
	methods: ["POST"],
	handler: registerProject,
});
