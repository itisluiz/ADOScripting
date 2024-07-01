import { TableEntity } from "@azure/data-tables";

export interface ProjectEntity extends TableEntity {
	organization: string;
	project: string;
}
