import { azureCredential } from "./identity";
import { TableClient, TableServiceClient } from "@azure/data-tables";

export const azureTables = new TableServiceClient(
	`https://${process.env["AZURE_STORAGE_ACCOUNT"]}.table.core.windows.net`,
	azureCredential,
);

export const azureTable = (tableName: string) =>
	new TableClient(
		`https://${process.env["AZURE_STORAGE_ACCOUNT"]}.table.core.windows.net`,
		tableName,
		azureCredential,
	);
