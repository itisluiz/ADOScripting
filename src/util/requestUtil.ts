import { HandlingError } from "../errors/handlingError";
import { HttpRequest } from "@azure/functions";
import { JSONPath } from "jsonpath-plus";

export async function requestJson<T>(request: HttpRequest, ...jsonPaths: string[]): Promise<T> {
	let json: any;

	try {
		json = await request.json();
	} catch (error) {
		throw new HandlingError("Invalid JSON provided in request", 400, false);
	}

	for (let jsonPath of jsonPaths) {
		if (JSONPath({ path: jsonPath, json }).length === 0) {
			throw new HandlingError(`Missing field '${jsonPath}' in JSON`, 400, false);
		}
	}

	return json as T;
}

export async function requestQuery(request: HttpRequest, ...queryKeys: string[]) {
	for (let queryKey of queryKeys) {
		if (!request.query.has(queryKey)) {
			throw new HandlingError(`Missing field '${queryKey}' in query`, 400, false);
		}
	}

	return request.query.get.bind(request.query) as (name: string) => string;
}
