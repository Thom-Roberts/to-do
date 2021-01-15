export interface ItemResponse {
	user: string;
	items: Item[];
}

interface Item {
	guid?: string;
	name: string;
	completed: boolean;
}