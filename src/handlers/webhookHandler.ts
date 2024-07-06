import { azureBlobs } from "../azure/blob";
import { azureDevops } from "../azure/devops";
import { azureKeyvault } from "../azure/keyvault";
import { azureTables } from "../azure/tables";
import { HandlingError } from "../errors/handlingError";
import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { invokeScript } from "../util/scriptUtil";
import { isRunningLocally, makeMetaLogger } from "../util/debugUtil";
import { ProjectEntity } from "../interfaces/entities/projectEntity";
import { requestHeader, requestJson } from "../util/requestUtil";
import { resolve } from "path";
import { getScriptBody } from "../../script/builder";

export async function webhookHandlerPOST(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	const getHeaderData = requestHeader(request, "project-id");
	const payload = await requestJson(request);

	const table = await azureTables.getOrCreateTable("projects");
	const entity = await azureTables.getEntityIfExists<ProjectEntity>(table, getHeaderData("project-id")!);

	if (!entity) {
		throw new HandlingError("Project not found", 404, false);
	}

	const apiKey = await azureKeyvault.getSecretIfExists(getHeaderData("project-id")!);
	if (!apiKey || !apiKey.value) {
		throw new HandlingError("API key for project not found", 404, false);
	}

	const container = await azureBlobs.getOrCreateContainer("scripts");
	const blobItems = await azureBlobs.getBlobItems(container, `${getHeaderData("project-id")}/`);

	const devopsClients = azureDevops.entryClients(entity.organization, apiKey.value!);
	await devopsClients.organization.connect();

	let scriptDownloads = blobItems.map((blobItem) => azureBlobs.downloadBlobItemIfExists(container, blobItem.name));
	scriptDownloads = scriptDownloads.filter((scriptDownload) => scriptDownload !== null);

	if (isRunningLocally()) {
		scriptDownloads.push(Promise.resolve([null as any, "[script]", getScriptBody()]));
	}

	let executionResults: { [key: string]: string } = {};
	for await (const scriptDownload of scriptDownloads) {
		const [_, scriptName, script] = scriptDownload!;

		const _payload = payload;
		const _devops = devopsClients;
		const _logger = makeMetaLogger(context, `[${entity.organization}/${entity.project}/${scriptName}]`);
		executionResults[scriptName] = await invokeScript(script, _payload, _devops, _logger);
	}

	return {
		status: 200,
		jsonBody: executionResults,
	};
}

export async function webhookHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	switch (request.method) {
		case "POST":
			return await webhookHandlerPOST(request, context);
		default:
			throw new HandlingError("Method not allowed", 405, false);
	}
}
