import { azureKeyvault } from "../azure/keyvault";
import { azureTable } from "../azure/tables";
import { HandlingError } from "../errors/handlingError";
import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { md5 } from "../util/hashUtil";
import { ProjectEntity } from "../interfaces/entities/projectEntity";
import { projectRequest } from "../interfaces/requests/projectRequest";
import { requestJson, requestQuery } from "../util/requestUtil";
import { RestError } from "@azure/data-tables";

async function projectHandlerGET(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	let projects: ProjectEntity[] = [];
	let projectIterator = azureTable("adoprojects").listEntities<ProjectEntity>();

	for await (let page of projectIterator.byPage()) {
		projects = projects.concat(page);
	}

	return {
		status: 200,
		jsonBody: projects.map((project) => {
			return {
				projectId: project.rowKey,
				organization: project.organization,
				project: project.project,
			};
		}),
	};
}

async function projectHandlerPOST(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	let data = await requestJson<projectRequest>(request, "$.organization", "$.project", "$.pat");
	let projectId = md5(data.organization, data.project);

	await Promise.all([
		azureKeyvault.setSecret(projectId, data.pat),
		azureTable("adoprojects").upsertEntity({
			partitionKey: "P0",
			rowKey: projectId,
			organization: data.organization,
			project: data.project,
		} as ProjectEntity),
	]);

	context.info(`Project created for ${data.organization}::${data.project} (ID: ${projectId})`);

	return {
		status: 201,
		jsonBody: {
			projectId,
		},
	};
}

async function projectHandlerDELETE(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	let data = await requestQuery(request, "projectId");

	Promise.all([
		azureKeyvault.beginDeleteSecret(data("projectId")).catch((error) => {
			if (!(error instanceof RestError) || error.statusCode !== 404) {
				throw error;
			}
		}),
		azureTable("adoprojects")
			.deleteEntity("P0", data("projectId"))
			.catch((error) => {
				if (!(error instanceof RestError) || error.statusCode !== 404) {
					throw error;
				}
			}),
	]);

	context.info(`Project deleted (if it existed): ${data("projectId")}`);

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
