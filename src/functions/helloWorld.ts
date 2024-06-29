import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

async function helloWorld(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	context.log("Http function was triggered.");
	return { body: "Hello, world!" };
}

app.http("helloWorld", {
	methods: ["GET", "POST"],
	handler: helloWorld,
});
