export interface ScriptPostRequest {
	projectId: string;
	name: string;
	script: string;
}

export const scriptPostRequestFields = ["projectId", "name", "script"];
