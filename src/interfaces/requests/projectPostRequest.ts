export interface ProjectPostRequest {
	organization: string;
	project: string;
	apiKey: string;
}

export const projectPostRequestFields = ["organization", "project", "apiKey"];
