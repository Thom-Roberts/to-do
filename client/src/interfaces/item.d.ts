export interface ItemResponse {
	guid: string;
	user: string;
	items: Item[];
}

interface Item {
	guid?: string;
	name: string;
	completed: boolean;
}