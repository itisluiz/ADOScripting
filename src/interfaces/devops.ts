import { WebApi } from "azure-devops-node-api";

export interface DevOps {
	organization: WebApi;
	deployment: WebApi;
}
