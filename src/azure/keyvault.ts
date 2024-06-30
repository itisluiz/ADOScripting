import { SecretClient } from "@azure/keyvault-secrets";
import { credentials } from "./identity";

export const keyvault = new SecretClient(`https://${process.env["AZURE_KEYVAULT_NAME"]}.vault.azure.net`, credentials);
