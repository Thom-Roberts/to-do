import { Router } from 'express';
import path from 'path';
import fs from 'fs/promises';

export const router = Router();

interface ItemsSchema {
	user: string;
	items: Item[];
}

interface Item {
	guid: string;
	name: string;
	completed: boolean;
}

const ITEMS_PATH = path.join(__dirname, 'items.json');

router.route('/').get((req, res) => {
	res.sendStatus(200);
});

router.route('/user').get(async (req, res) => {
	if(!req.query.user) {
		console.log('No user in request headers.');
		res.status(400).send('User must be specified');
		return;
	}

	try {
		const fileContents: ItemsSchema[] = JSON.parse(await fs.readFile(ITEMS_PATH, { encoding: 'utf8'}));
	
		const obj = fileContents.filter(content => content.user === req.query.user);

		if(obj.length === 1) {
			res.status(200).send(obj[0]);
			return;
		}
		else {
			// Add user

			// Return new user
			let objToReturn: ItemsSchema = {
				user: req.query.user as string,
				items: []
			};
			fileContents.push(objToReturn);

			await fs.writeFile(ITEMS_PATH, JSON.stringify(fileContents));
			res.status(200).send(objToReturn);
			return;
		}
	}
	catch(err) {
		console.error('Something went wrong trying to create a user');
		console.log(req.query);
		res.sendStatus(500);
	}
});

router.route('/items').get(async (req, res) => {
	if(!req.query.user) {
		console.log('No user in request headers.');
		res.status(400).send('User must be specified');
		return;
	}

	try {
		const fileContents: ItemsSchema[] = JSON.parse(await fs.readFile(ITEMS_PATH, { encoding: 'utf8'}));
	
		const obj = fileContents.filter(content => content.user === req.query.user);

		let objToReturn: ItemsSchema;

		if(obj.length === 0) {
			console.log('User has no items yet. Setting up a list for them.');
			objToReturn = {
				user: req.query.user as string,
				items: [],
			};
			console.log(objToReturn);
			fileContents.push(
				objToReturn
			);

			await fs.writeFile(ITEMS_PATH, JSON.stringify(fileContents));
		}
		else if(obj.length === 1) {
			objToReturn = obj[0];
		}
		else {
			console.error('Duplicate users found with that name. Cannot resolve name.');
			res.status(400).send('Duplicate users found with that name. Cannot resolve name.');
			return;
		}

		res.send(objToReturn);
	}
	catch(err) {
		console.error(err);
		res.sendStatus(500);
	}
});

router.route('/add_item').post(async (req, res) => {
	if(!req.body) {
		console.log('No body.');
		res.status(400).send('Item must have a body.');
	}
	
	const { user, task }: { user: string, task: string } = req.body;
	const fileContents = await GetFileContents();
	
	// Verify user exists
	const userObj = fileContents.filter(content => content.user === user);
	if(userObj.length === 0 || userObj.length > 1) {
		console.error('User does not exist or duplicate detected. This should never happen.');
		res.sendStatus(500);
	}

	const temp = userObj[0];
	const guid = uuidv4();
	temp.items.push({
		name: task,
		completed: false,
		guid,
	});

	SetFileContents(fileContents);
	res.status(200).send(guid);
});

router.route('/toggle_complete').post(async (req, res) => {
	if(!req.body) {
		console.log('No body.');
		res.status(400).send('Item must have a body.');
	}

	const { user, task }: { user: string, task: string } = req.body;
	const fileContents = await GetFileContents();

	// Verify user exists
	const userObj = fileContents.filter(content => content.user === user);
	if(userObj.length === 0 || userObj.length > 1) {
		console.error('User does not exist or duplicate detected. This should never happen.');
		res.sendStatus(500);
	}

	const temp = userObj[0];
	const item = temp.items.filter(obj => obj.guid === task);
	if(item.length === 0 || item.length > 1) {
		console.error('Item does not exist or duplicate detected. This should never happen.');
		res.sendStatus(500);
	}

	item[0].completed = !item[0].completed;

	await SetFileContents(fileContents);
	res.sendStatus(200);
});

router.route('/delete_item').delete(async (req, res) => {
	if(!req.query) {
		console.log('No params');
		res.status(400).send('User and task is required');
	}

	// @ts-ignore
	const { user, task }: { user: string, task: string } = req.query;
	const fileContents = await GetFileContents();
	
	const userObj = fileContents.filter(content => content.user === user);
	if(userObj.length === 0 || userObj.length > 1) {
		console.error('User does not exist or duplicate detected. This should never happen.');
		res.sendStatus(500);
		return;
	}

	const temp = userObj[0];
	const idx = temp.items.findIndex(val => val.guid === task);
	
	if(idx === -1) {
		console.error('Item does not exist or duplicate detected. This should never happen.');
		res.sendStatus(500);
		return;
	}

	temp.items.splice(idx, 1);
	SetFileContents(fileContents);

	res.sendStatus(200);
});

async function GetFileContents(): Promise<ItemsSchema[]> {
	return JSON.parse(await fs.readFile(ITEMS_PATH, { encoding: 'utf8'})) as ItemsSchema[];
}

function SetFileContents(obj: ItemsSchema[]) {
	return fs.writeFile(ITEMS_PATH, JSON.stringify(obj));
}

// https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
function uuidv4() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c === 'x' ? r : ( (r & 0x3) | 0x8);
		return v.toString(16);
	});
}