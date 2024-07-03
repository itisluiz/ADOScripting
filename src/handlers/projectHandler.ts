import { azureBlobs } from "../azure/blob";
import { azureKeyvault } from "../azure/keyvault";
import { azureTables } from "../azure/tables";
import { HandlingError } from "../errors/handlingError";
import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { md5 } from "../util/hashUtil";
import { ProjectEntity } from "../interfaces/entities/projectEntity";
import { ProjectGetResult } from "../interfaces/results/projectGetResult";
import { ProjectPostRequest, projectPostRequestFields } from "../interfaces/requests/projectPostRequest";
import { ProjectPostResult } from "../interfaces/results/projectPostResult";
import { requestJson, requestQuery } from "../util/requestUtil";

async function projectHandlerGET(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	const table = await azureTables.getOrCreateTable("projects");
	const entities = await azureTables.getEntities<ProjectEntity>(table);

	const result = entities.map((entity): ProjectGetResult => {
		return {
			projectId: entity.rowKey,
			organization: entity.organization,
			project: entity.project,
			timestamp: entity.timestamp,
		};
	});

	return {
		status: 200,
		jsonBody: result,
	};
}

async function projectHandlerPOST(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	const jsonData = await requestJson<ProjectPostRequest>(request, ...projectPostRequestFields);
	const projectId = md5(jsonData.organization, jsonData.project);

	const projectEntity: ProjectEntity = {
		organization: jsonData.organization,
		project: jsonData.project,
		rowKey: projectId,
		partitionKey: "",
	};

	const table = await azureTables.getOrCreateTable("projects");
	await azureKeyvault.setOrPurgeSecret(projectId, jsonData.apiKey);
	await azureTables.updateOrCreateEntity(table, projectEntity);

	const result: ProjectPostResult = {
		projectId: projectId,
	};

	return {
		status: 200,
		jsonBody: result,
	};
}

async function projectHandlerDELETE(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	const getQueryData = requestQuery(request, "projectId");

	const table = await azureTables.getOrCreateTable("projects");
	const container = await azureBlobs.getOrCreateContainer("scripts");

	let deletionResults = await Promise.all([
		azureKeyvault.deleteSecretIfExists(getQueryData("projectId")!),
		azureTables.deleteEntityIfExists(table, getQueryData("projectId")!),
		azureBlobs.deleteBlobItems(container, `${getQueryData("projectId")}/`),
	]);

	if (deletionResults[0] == null && deletionResults[1] == null && deletionResults[2].length === 0) {
		throw new HandlingError("Project not found", 404, false);
	}

	return {
		status: 200,
	};
}

export async function projectHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	switch (request.method) {
		case "GET":
			return await projectHandlerGET(request, context);
		case "POST":
			return await projectHandlerPOST(request, context);
		case "DELETE":
			return await projectHandlerDELETE(request, context);
		default:
			throw new HandlingError("Method not allowed", 405, false);
	}
}
