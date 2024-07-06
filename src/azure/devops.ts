import { WebApi, getPersonalAccessTokenHandler } from "azure-devops-node-api";

const entryClient = (organization: string, apiToken: string, vssps: boolean = false) =>
	new WebApi(
		`https://${vssps ? "vssps.dev" : "dev"}.azure.com/${organization}`,
		getPersonalAccessTokenHandler(apiToken),
	);

const entryClients = (organization: string, apiToken: string) => ({
	organization: entryClient(organization, apiToken, false),
	deployment: entryClient(organization, apiToken, true),
});

export const azureDevops = { entryClient, entryClients };
