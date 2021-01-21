import { Router } from 'express';
import path from 'path';
// Remember to change this to require('fs').promises when you fully deploy
import fs from 'fs/promises';

export const router = Router();

interface ItemsSchema {
	user: string;
	lists: List[];
}

interface List {
	name: string;
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
		const fileContents: ItemsSchema[] = await GetFileContents();
	
		const obj = fileContents.filter(content => content.user === req.query.user);

		if(obj.length === 1) {
			res.status(200).send(obj[0]);
			return;
		}
		else {
			// Add user
			let objToReturn: ItemsSchema = {
				user: req.query.user as string,
				lists: [
					{
						name: "Default",
						items: []
					}
				],
			};
			fileContents.push(objToReturn);

			await fs.writeFile(ITEMS_PATH, JSON.stringify(fileContents));
			// Return new user

			res.status(200).send(objToReturn);
			return;
		}
	}
	catch(err) {
		console.error('Something went wrong trying to create a user');
		console.log(req.query);
		res.status(400).send(err);
	}
});

router.route('/items').get(async (req, res) => {
	if(!req.query.user) {
		console.log('No user in request headers.');
		res.status(400).send('User must be specified');
		return;
	}

	try {
		const fileContents: ItemsSchema[] = await GetFileContents();
	
		const obj = fileContents.filter(content => content.user === req.query.user);

		let objToReturn: ItemsSchema;

		if(obj.length === 0) {
			console.log('User has no items yet. Setting up a list for them.');
			objToReturn = {
				user: req.query.user as string,
				lists: [
					{
						name: "Default",
						items: []
					}
				],
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
		res.status(400).send(err);
	}
});

router.route('/add_list').post(async (req, res) => {
	if(!req.body) {
		console.log('No body.');
		res.status(400).send('List must have a body.');
		return;
	}

	const { user, list }: { user: string, list: string } = req.body;
	const fileContents = await GetFileContents();

	// Verify user exists
	const userObj = fileContents.filter(content => content.user === user);
	if(userObj.length === 0 || userObj.length > 1) {
		console.error('User does not exist or duplicate detected. This should never happen.');
		res.status(400).send('User does not exist or duplicate detected. This should never happen.');
		return;
	}

	// Test if list name exists already
	const listObj = userObj[0].lists.filter(obj => {
		obj.name === list;
	});

	if(listObj.length > 0) {
		console.error('Duplicate list name found. Cannot complete request.');
		res.status(400).send('Duplicate list name.');
		return;
	}

	// Create list
	userObj[0].lists.push({
		name: list,
		items: [],
	});

	await SetFileContents(fileContents);

	res.sendStatus(200);
});

router.route('/add_item').post(async (req, res) => {
	if(!req.body) {
		console.log('No body.');
		res.status(400).send('Item must have a body.');
		return;
	}
	
	const { user, list, task }: { user: string, list: string, task: string } = req.body;
	const fileContents = await GetFileContents();
	
	// Verify user exists
	const userObj = fileContents.filter(content => content.user === user);
	if(userObj.length === 0 || userObj.length > 1) {
		console.error('User does not exist or duplicate detected. This should never happen.');
		res.status(400).send('User does not exist or duplicate detected. This should never happen.');
		return;
	}

	const temp = userObj[0];
	const temp2 = temp.lists.filter((l) => l.name === list);
	if(temp2.length === 0 || temp2.length > 1) {
		console.error('Duplicate lists found. This should never happen.');
		res.status(400).send('Duplicate lists found. This should never happen.');
		return;
	}

	const guid = uuidv4();
	temp2[0].items.push({
		name: task,
		completed: false,
		guid,
	});

	SetFileContents(fileContents);
	res.status(200).send(guid);
});

router.route('/update_task').put(async (req, res) => {
	if(!req.body) {
		console.log('No body.');
		res.status(400).send('Item must have a body.');
		return;
	}

	const { user, guid, list, text }: { user: string, guid: string, list: string, text: string} = req.body;
	const fileContents = await GetFileContents();
	
	// Verify user exists
	const userObj = fileContents.filter(content => content.user === user);
	if(userObj.length === 0 || userObj.length > 1) {
		console.error('User does not exist or duplicate detected. This should never happen.');
		res.status(400).send('User does not exist or duplicate detected. This should never happen.');
		return;
	}

	const temp = userObj[0];
	const temp2 = temp.lists.filter((l) => l.name === list);
	if(temp2.length === 0 || temp2.length > 1) {
		console.error('Duplicate lists found. This should never happen.');
		res.status(400).send('Duplicate lists found. This should never happen.');
		return;
	}

	const tempItemFilter = temp2[0].items.filter(item => item.guid === guid);
	if(tempItemFilter.length === 0 || tempItemFilter.length > 1)  {
		console.error('Item does not exist or duplicate detected. This should never happen.');
		res.status(400).send('Item does not exist or duplicate detected. This should never happen.');
		return;
	}

	tempItemFilter[0].name = text;
	await SetFileContents(fileContents);
	res.sendStatus(200);
});

router.route('/toggle_complete').post(async (req, res) => {
	if(!req.body) {
		console.log('No body.');
		res.status(400).send('Item must have a body.');
		return;
	}

	const { user, list, task }: { user: string, list: string, task: string } = req.body;
	const fileContents = await GetFileContents();

	// Verify user exists
	const userObj = fileContents.filter(content => content.user === user);
	if(userObj.length === 0 || userObj.length > 1) {
		console.error('User does not exist or duplicate detected. This should never happen.');
		res.status(400).send('User does not exist or duplicate detected. This should never happen.');
		return;
	}

	const temp = userObj[0];
	const temp2 = temp.lists.filter((l) => l.name === list);
	if(temp2.length === 0 || temp2.length > 1) {
		console.error('Duplicate lists found. This should never happen.');
		res.status(400).send('Duplicate lists found. This should never happen.');
		return;
	}
	
	const item = temp2[0].items.filter(obj => obj.guid === task);
	if(item.length === 0 || item.length > 1) {
		console.error('Item does not exist or duplicate detected. This should never happen.');
		res.status(400).send('Item does not exist or duplicate detected. This should never happen.');
		return;
	}

	item[0].completed = !item[0].completed;

	await SetFileContents(fileContents);
	res.sendStatus(200);
});

router.route('/delete_item').delete(async (req, res) => {
	if(!req.query) {
		console.log('No params');
		res.status(400).send('User and task is required');
		return;
	}

	// @ts-ignore
	const { user, list, task }: { user: string, list: string, task: string } = req.query;
	const fileContents = await GetFileContents();
	
	const userObj = fileContents.filter(content => content.user === user);
	if(userObj.length === 0 || userObj.length > 1) {
		console.error('User does not exist or duplicate detected. This should never happen.');
		res.status(400).send('User does not exist or duplicate detected. This should never happen.');
		return;
	}

	const temp = userObj[0];

	const temp2 = temp.lists.filter((l) => l.name === list);
	if(temp2.length === 0 || temp2.length > 1) {
		console.error('Duplicate lists found. This should never happen.');
		res.status(400).send('Duplicate lists found. This should never happen.');
		return;
	}

	const idx = temp2[0].items.findIndex(val => val.guid === task);
	
	if(idx === -1) {
		console.error('Item does not exist or duplicate detected. This should never happen.');
		res.status(400).send('Item does not exist or duplicate detected. This should never happen.');
		return;
	}

	temp2[0].items.splice(idx, 1);
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