import { HandlingError } from "../errors/handlingError";
import { HttpRequest } from "@azure/functions";

export async function requestJson<T>(request: HttpRequest, ...jsonKeys: string[]): Promise<T> {
	let json: any;

	try {
		json = await request.json();
	} catch (error) {
		throw new HandlingError("Invalid JSON provided in request", 400, false);
	}

	for (let jsonKey of jsonKeys) {
		if (!json.hasOwnProperty(jsonKey)) {
			throw new HandlingError(`Missing field '${jsonKey}' in JSON`, 400, false);
		}
	}

	return json as T;
}

export function requestQuery(request: HttpRequest, ...queryKeys: string[]) {
	for (let queryKey of queryKeys) {
		if (!request.query.has(queryKey)) {
			throw new HandlingError(`Missing field '${queryKey}' in query`, 400, false);
		}
	}

	return request.query.get.bind(request.query);
}

export function requestHeader(request: HttpRequest, ...headerKeys: string[]) {
	for (let headerKey of headerKeys) {
		if (!request.headers.has(headerKey)) {
			throw new HandlingError(`Missing field '${headerKey}' in headers`, 400, false);
		}
	}

	return request.headers.get.bind(request.headers);
}
