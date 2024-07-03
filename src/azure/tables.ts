import { azureCredential } from "./identity";
import { RestError, TableClient, TableEntity, TableEntityResult, TableServiceClient } from "@azure/data-tables";

const url = `https://${process.env["AZURE_STORAGE_ACCOUNT"]}.table.core.windows.net`;
const defaultPartitionKey = "P0";

const baseClient = new TableServiceClient(url, azureCredential);
const entryClient = (tableName: string) => new TableClient(url, tableName, azureCredential);

async function getOrCreateTable(tableName: string) {
	await baseClient.createTable(tableName);
	return entryClient(tableName);
}

async function updateOrCreateEntity<T extends TableEntity>(
	tableClient: TableClient,
	entity: T,
	partitionKey: string = defaultPartitionKey,
) {
	entity.partitionKey = entity.partitionKey || partitionKey;
	return await tableClient.upsertEntity(entity);
}

async function getEntityIfExists<T extends TableEntity>(
	tableClient: TableClient,
	rowKey: string,
	partitionKey: string = defaultPartitionKey,
) {
	try {
		return await tableClient.getEntity<T>(partitionKey, rowKey);
	} catch (error) {
		if (!(error instanceof RestError) || error.statusCode !== 404) {
			throw error;
		}
	}

	return null;
}

async function getEntities<T extends TableEntity>(tableClient: TableClient) {
	const entities: TableEntityResult<T>[] = [];
	const entityIterator = tableClient.listEntities();
	for await (const entity of entityIterator) {
		entities.push(entity as TableEntityResult<T>);
	}

	return entities;
}

async function deleteEntityIfExists(
	tableClient: TableClient,
	rowKey: string,
	partitionKey: string = defaultPartitionKey,
) {
	try {
		return await tableClient.deleteEntity(partitionKey, rowKey);
	} catch (error) {
		if (!(error instanceof RestError) || error.statusCode !== 404) {
			throw error;
		}
	}

	return null;
}

export const azureTables = {
	baseClient,
	entryClient,
	getOrCreateTable,
	updateOrCreateEntity,
	getEntityIfExists,
	getEntities,
	deleteEntityIfExists,
};
