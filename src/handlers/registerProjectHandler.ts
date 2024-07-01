import { azureKeyvault } from "../azure/keyvault";
import { azureTable } from "../azure/tables";
import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { md5 } from "../util/hashUtil";
import { ProjectEntity } from "../interfaces/entities/projectEntity";
import { RegisterProjectRequest } from "../interfaces/requests/registerProjectRequest";
import { requestJson } from "../util/requestUtil";

export async function registerProjectHandler(
	request: HttpRequest,
	context: InvocationContext,
): Promise<HttpResponseInit> {
	let data = await requestJson<RegisterProjectRequest>(request, "$.organization", "$.project", "$.pat");
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

	return {
		status: 201,
		jsonBody: {
			projectId,
		},
	};
}
