export interface ItemResponse {
	user: string;
	items: Item[];
}

interface Item {
	guid?: string; // Optional for when I fetch it later
	name: string;
	completed: boolean;
}