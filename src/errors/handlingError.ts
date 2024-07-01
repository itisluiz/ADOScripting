export class HandlingError extends Error {
	public status: number;
	public sensitive: boolean;

	constructor(message: string, status: number = 500, sensitive: boolean = true) {
		super(message);
		this.status = status;
		this.sensitive = sensitive;
		this.name = "HandlingError";
	}
}
