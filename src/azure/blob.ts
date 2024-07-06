import { azureCredential } from "./identity";
import {
	BlobDownloadResponseParsed,
	BlobItem,
	BlobServiceClient,
	ContainerClient,
	RestError,
} from "@azure/storage-blob";
import { Readable } from "stream";
import { text } from "stream/consumers";

const url = `https://${process.env["AZURE_STORAGE_ACCOUNT"]}.blob.core.windows.net`;

const baseClient = new BlobServiceClient(url, azureCredential);

async function getOrCreateContainer(containerName: string) {
	const containerClient = baseClient.getContainerClient(containerName);
	await containerClient.createIfNotExists();
	return containerClient;
}

async function uploadBlobItem(containerClient: ContainerClient, blobName: string, content: string) {
	return await containerClient.uploadBlockBlob(blobName, Readable.from(content), content.length);
}

async function downloadBlobItemIfExists(
	containerClient: ContainerClient,
	blobName: string,
): Promise<[BlobDownloadResponseParsed, string, string] | null> {
	try {
		const blobClient = containerClient.getBlobClient(blobName);
		const downloadResult = await blobClient.getBlockBlobClient().download();
		return [
			downloadResult,
			blobName.substring(blobName.lastIndexOf("/") + 1),
			await text(downloadResult.readableStreamBody!),
		];
	} catch (error) {
		if (!(error instanceof RestError) || error.statusCode !== 404) {
			throw error;
		}
	}

	return null;
}

async function getBlobItems(containerClient: ContainerClient, directory?: string) {
	const blobItems: BlobItem[] = [];
	const blobIterator = containerClient.listBlobsFlat();
	for await (const blob of blobIterator) {
		if (!blob.deleted) {
			blobItems.push(blob);
		}
	}

	return directory ? blobItems.filter((blobItem) => blobItem.name.startsWith(directory)) : blobItems;
}

async function deleteBlobItemIfExists(containerClient: ContainerClient, blobName: string) {
	const blobClient = containerClient.getBlobClient(blobName);
	return await blobClient.deleteIfExists();
}

async function deleteBlobItems(containerClient: ContainerClient, directory: string) {
	const blobItems = await getBlobItems(containerClient, directory);
	return await Promise.all(blobItems.map((blobItem) => containerClient.deleteBlob(blobItem.name)));
}

export const azureBlobs = {
	baseClient,
	getOrCreateContainer,
	uploadBlobItem,
	downloadBlobItemIfExists,
	getBlobItems,
	deleteBlobItemIfExists,
	deleteBlobItems,
};
