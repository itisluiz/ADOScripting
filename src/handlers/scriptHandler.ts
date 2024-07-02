import { azureBlob } from "../azure/blob";
import { azureTable } from "../azure/tables";
import { BlobItem } from "@azure/storage-blob";
import { HandlingError } from "../errors/handlingError";
import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Readable } from "stream";
import { requestJson, requestQuery } from "../util/requestUtil";
import { RestError } from "@azure/data-tables";
import { sanitizeFileName } from "../util/sanitizationUtil";
import { ScriptRequest } from "../interfaces/requests/scriptRequest";

async function scriptHandlerGET(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	let data = await requestQuery(request, "projectId");
	let blobs: BlobItem[] = [];
	let blobIterator = azureBlob.getContainerClient(data("projectId")).listBlobsFlat();

	await azureTable("adoprojects")
		.getEntity("P0", data("projectId"))
		.catch((error) => {
			if (error instanceof RestError && error.statusCode === 404) {
				throw new HandlingError(`Project with ID ${data("projectId")} not found`, 404, false);
			}
			throw error;
		});

	try {
		for await (let blob of blobIterator) {
			if (!blob.deleted) {
				blobs.push(blob);
			}
		}
	} catch (error) {
		if (error instanceof RestError && error.statusCode === 404) {
			return {
				status: 200,
				jsonBody: [],
			};
		}
		throw error;
	}

	return {
		status: 200,
		jsonBody: blobs.map((blob) => {
			return {
				scriptName: blob.name,
				size: blob.properties.contentLength,
				lastModified: blob.properties.lastModified,
			};
		}),
	};
}

async function scriptHandlerPUT(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	let data = await requestJson<ScriptRequest>(request, "$.projectId", "$.scriptName", "$.script");

	await azureTable("adoprojects")
		.getEntity("P0", data.projectId)
		.catch((error) => {
			if (error instanceof RestError && error.statusCode === 404) {
				throw new HandlingError(`Project with ID ${data.projectId} not found`, 404, false);
			}
			throw error;
		});

	await azureBlob.createContainer(data.projectId).catch((error) => {
		if (!(error instanceof RestError) || error.statusCode !== 409) {
			throw error;
		}
	});

	let sanitizedName = sanitizeFileName(data.scriptName, "js");
	let container = azureBlob.getContainerClient(data.projectId);
	await container.uploadBlockBlob(sanitizedName, Readable.from(data.script), data.script.length);

	context.info(`Script '${sanitizedName}' uploaded to project '${data.projectId}'`);

	return {
		status: 201,
		jsonBody: {
			scriptName: sanitizedName,
		},
	};
}

async function scriptHandlerDELETE(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	let data = await requestQuery(request, "projectId", "scriptName");

	await azureTable("adoprojects")
		.getEntity("P0", data("projectId"))
		.catch((error) => {
			if (error instanceof RestError && error.statusCode === 404) {
				throw new HandlingError(`Project with ID ${data("projectId")} not found`, 404, false);
			}
			throw error;
		});

	let sanitizedName = sanitizeFileName(data("scriptName"), "js");
	let container = azureBlob.getContainerClient(data("projectId"));

	container.deleteBlob(sanitizedName).catch((error) => {
		if (!(error instanceof RestError) || error.statusCode !== 404) {
			throw error;
		}
	});

	context.info(`Script '${sanitizedName}' deleted from project '${data("projectId")}' (if it existed)`);

	return {
		status: 200,
	};
}

export async function scriptHandler(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
	switch (request.method) {
		case "GET":
			return await scriptHandlerGET(request, context);
		case "PUT":
			return await scriptHandlerPUT(request, context);
		case "DELETE":
			return await scriptHandlerDELETE(request, context);
		default:
			throw new HandlingError("Method not allowed", 405, false);
	}
}
