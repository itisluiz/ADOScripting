import { ClientSecretCredential } from "@azure/identity";

export const credentials = new ClientSecretCredential(
	process.env["AZURE_TENANT_ID"]!,
	process.env["AZURE_CLIENT_ID"]!,
	process.env["AZURE_CLIENT_SECRET"]!,
);
