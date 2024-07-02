import { azureCredential } from "./identity";
import { BlobServiceClient } from "@azure/storage-blob";

export const azureBlob = new BlobServiceClient(
	`https://${process.env["AZURE_STORAGE_ACCOUNT"]}.blob.core.windows.net`,
	azureCredential,
);
