import { azureCredential } from "./identity";
import { SecretClient } from "@azure/keyvault-secrets";

export const azureKeyvault = new SecretClient(
	`https://${process.env["AZURE_KEYVAULT_NAME"]}.vault.azure.net`,
	azureCredential,
);
