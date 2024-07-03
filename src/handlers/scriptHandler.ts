import { azureBlobs } from "../azure/blob";
import { azureTables } from "../azure/tables";
import { HandlingError } from "../errors/handlingError";
import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { ProjectEntity } from "../interfaces/entities/projectEntity";
import { requestJson, requestQuery } from "../util/requestUtil";
import { sanitizeFileName } from "../util/sanitizationUtil";
import { ScriptGetResult } from "../interfaces/results/scriptGetResult";
import { ScriptPostRequest, scriptPostRequestFields } from "../interfaces/requests/scriptPostRequest";

async function scriptHandlerGET(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	const getQueryData = requestQuery(request, "projectId");

	const table = await azureTables.getOrCreateTable("projects");
	const entity = await azureTables.getEntityIfExists<ProjectEntity>(table, getQueryData("projectId")!);

	if (!entity) {
		throw new HandlingError("Project not found", 404, false);
	}

	const container = await azureBlobs.getOrCreateContainer("scripts");
	const blobItems = await azureBlobs.getBlobItems(container, `${getQueryData("projectId")}/`);

	const result = blobItems.map((blobItem): ScriptGetResult => {
		return {
			name: blobItem.name.replace(`${getQueryData("projectId")}/`, ""),
			size: blobItem.properties.contentLength!,
			lastModified: blobItem.properties.lastModified!.toISOString(),
		};
	});

	return {
		status: 200,
		jsonBody: result,
	};
}

async function scriptHandlerPOST(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	const jsonData = await requestJson<ScriptPostRequest>(request, ...scriptPostRequestFields);

	const table = await azureTables.getOrCreateTable("projects");
	const entity = await azureTables.getEntityIfExists<ProjectEntity>(table, jsonData.projectId);

	if (!entity) {
		throw new HandlingError("Project not found", 404, false);
	}

	const container = await azureBlobs.getOrCreateContainer("scripts");
	const blobName = `${jsonData.projectId}/${sanitizeFileName(jsonData.name)}`;
	await azureBlobs.uploadBlobItem(container, blobName, jsonData.script);

	return {
		status: 200,
	};
}

async function scriptHandlerDELETE(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	const getQueryData = requestQuery(request, "projectId", "name");

	const table = await azureTables.getOrCreateTable("projects");
	const entity = await azureTables.getEntityIfExists<ProjectEntity>(table, getQueryData("projectId")!);

	if (!entity) {
		throw new HandlingError("Project not found", 404, false);
	}

	const container = await azureBlobs.getOrCreateContainer("scripts");
	const blobName = `${getQueryData("projectId")}/${sanitizeFileName(getQueryData("name")!)}`;
	const deleteResult = await azureBlobs.deleteBlobItemIfExists(container, blobName);

	if (!deleteResult.succeeded) {
		throw new HandlingError("Script not found", 404, false);
	}

	return {
		status: 200,
	};
}

export async function scriptHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	switch (request.method) {
		case "GET":
			return await scriptHandlerGET(request, context);
		case "POST":
			return await scriptHandlerPOST(request, context);
		case "DELETE":
			return await scriptHandlerDELETE(request, context);
		default:
			throw new HandlingError("Method not allowed", 405, false);
	}
}
