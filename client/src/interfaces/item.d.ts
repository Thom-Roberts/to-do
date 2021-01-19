export interface ItemResponse {
	user: string;
	lists: List[];
}

interface List {
	name: string;
	items: Item[];
}

interface Item {
	guid?: string; // Optional for when I fetch it later
	name: string;
	completed: boolean;
}