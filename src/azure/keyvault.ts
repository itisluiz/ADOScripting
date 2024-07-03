import { azureCredential } from "./identity";
import { HandlingError } from "../errors/handlingError";
import { RestError } from "@azure/storage-blob";
import { SecretClient } from "@azure/keyvault-secrets";

const url = `https://${process.env["AZURE_KEYVAULT_NAME"]}.vault.azure.net`;

const baseClient = new SecretClient(url, azureCredential);

async function setOrPurgeSecret(secretName: string, secretValue: string) {
	try {
		return await baseClient.setSecret(secretName, secretValue);
	} catch (error) {
		if (!(error instanceof RestError) || error.statusCode !== 409) {
			throw error;
		}
	}

	try {
		await baseClient.purgeDeletedSecret(secretName);
	} finally {
		throw new HandlingError("The previous apiKey secret is being purged, try again in a few seconds", 409, false);
	}
}

async function getSecretIfExists(secretName: string) {
	try {
		return await baseClient.getSecret(secretName);
	} catch (error) {
		if (!(error instanceof RestError) || error.statusCode !== 404) {
			throw error;
		}
	}

	return null;
}

async function deleteSecretIfExists(secretName: string) {
	try {
		return await baseClient.beginDeleteSecret(secretName);
	} catch (error) {
		if (!(error instanceof RestError) || error.statusCode !== 404) {
			throw error;
		}
	}

	return null;
}

export const azureKeyvault = { baseClient, setOrPurgeSecret, getSecretIfExists, deleteSecretIfExists };
