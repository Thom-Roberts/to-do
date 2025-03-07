import React, { useCallback, useEffect, useState } from 'react';
import axios, { AxiosResponse } from 'axios';
import { Container, Grid, Input, Loader, SegmentGroup,  } from 'semantic-ui-react';
import ListComponent from './components/list';
import { Item, ItemResponse, List } from './interfaces/item';
import Add from './components/add';
import ListLabel from './components/list_label';
import Filter from './components/filter';

enum FilterType {
	All,
	Incomplete,
	Complete
}

export default function App() {
	const [ loading, setLoading ] = useState(true);
	const [ user, setUser ] = useState(FetchFromStorage('User'));
	const [ lists, setLists ] = useState<List[]>([]);
	const [ activeList, setActiveList ] = useState(-1);
	const [ items, setItems ] = useState<Item[]>([]);
	const [ filterType, setFilterType ] = useState<FilterType>(FilterType.All);
	const [ addText, setAddText ] = useState(''); // Used for clearing text when a new item is added
	const [ editedText, setEditedText ] = useState<{text: string, guid: string}>();
	const [ itemToToggle, setItemToToggle ] = useState<Item>();
	const [ itemToDelete, setItemToDelete ] = useState<Item>();

	/**
	 * Fetch items on start if user is present
	 */
	useEffect(() => {
		(async() => {
			if(user === '') {
				setLoading(false);
				return;
			}
			try {
				const itemsResponse: AxiosResponse<ItemResponse> = await axios.get('/api/items', { params: { user } });
				setLists(itemsResponse.data.lists);
				setActiveList(0);
				// First list is always default
				setItems(itemsResponse.data.lists[0].items);
			}
			catch(err) {
				console.error(err);
				alert('Something went wrong while trying to fetch your items. Please try again later.');
			}
			finally {
				setLoading(false);
			}
		})();
	}, [ user ]);

	/**
	 * Create user
	 */
	useEffect(() => {
		if(loading)
			return;

		const element = document.getElementById('user_input');
		if(!element)
			return;
		
		async function enterPressed(e: KeyboardEvent) {
			if(e.key === 'Enter' || e.keyCode === 13) {
				const input = document.getElementById('user_input') as HTMLInputElement;
				
				// Don't add an empty item
				if(input.value === '' || input?.value === undefined)
					return;
				
				GetUser(input.value);
			}
		}

		element.addEventListener('keydown', enterPressed);

		return () => element.removeEventListener('keydown', enterPressed);
	}, [ loading ]);

	/**
	 * Change filter logic
	 */
	useEffect(() => {
		if(activeList === -1)
			return;
		setItems(() => {
			const all = lists[activeList].items;
			if(filterType === FilterType.All)
				return all;
			else if(filterType === FilterType.Complete) {
				return all.filter(item => {
					return item.completed
				});
			}
			else {
				return all.filter(item => {
					return !item.completed
				});
			}
		});
	}, [ lists, activeList, filterType ]);

	const handleAdd = useCallback(async(val: string) => {
		// Add it to the list of items
		const copy = items.slice();
		copy.push({
			name: val,
			completed: false,
		});
		setLists((prevLists) => {
			const temp = prevLists.slice();
			temp[activeList].items = copy;
			return temp;
		});
		//setItems(copy);

		try {
			// Attempt to communicate with the server
			const guid: AxiosResponse<string> = await axios.post('/api/add_item', { user, list: lists[activeList].name, task: val });

			// TODO: This update the GUID for an item. Do this on the list object instead
			setItems(prevItems => {
				const copy = prevItems.slice();
				const idx = copy.findIndex(item => item.name === val);
				copy[idx].guid = guid.data;
				return copy;
			});
		}
		catch(err) {
			if (err.response) {
				// Request made and server responded
				console.log(err.response.data);
				console.log(err.response.status);
				console.log(err.response.headers);
			} 
			else if (err.request) {
				// The request was made but no response was received
				console.log(err.request);
			} 
			else {
				// Something happened in setting up the request that triggered an Error
				console.log('Error', err.message);
			}
		}
		finally {
			// Clear the Add component	
			setAddText('');
		}
	}, [ user, lists, items, activeList ]);

	/**
	 * Add item setup
	 */
	useEffect(() => {
		// Can't add the logic unless it is active
		if(loading || user === '')
			return;

		let input = document.getElementById('new_task_input');

		async function enterPressed(e: KeyboardEvent) {
			if(e.key === 'Enter' || e.keyCode === 13) {
				let input = document.getElementById('new_task_input') as HTMLInputElement;
				// Don't add an empty item
				if(input?.value === '' || input?.value === undefined)
					return;
				
				handleAdd(input.value);
			}
		}

		input?.addEventListener('keydown', enterPressed);

		return () => {
			input?.removeEventListener('keydown', enterPressed);
		}
	}, [ loading, user, handleAdd ]);

	/**
	 * Edit item logic
	 */
	useEffect(() => {
		if(!editedText || !editedText.guid || !editedText.text)
			return;
		
		const { text, guid } = editedText;
		// See if a change was actually made
		// Find the task
		const task = items.filter(item => item.guid === guid);
		if(task.length === 0) {
			console.error('No tasks found with that guid, this should never happen');
			return;
		}
		if(task.length > 1) {
			console.error('More than one task found for that guid, this should never happen');
			return;
		}
		// No change made
		if(task[0].name === text)
			return;

		(async() => {
			try {
				// Submit update to server
				await axios.put('/api/update_task', {
					user,
					guid,
					list: lists[activeList].name,
					text
				});
			}
			catch(err) {
				if (err.response) {
					// Request made and server responded
					console.log(err.response.data);
					console.log(err.response.status);
					console.log(err.response.headers);
				} 
				else if (err.request) {
					// The request was made but no response was received
					console.log(err.request);
				} 
				else {
					// Something happened in setting up the request that triggered an Error
					console.log('Error', err.message);
				}
			}
			finally {
				setEditedText({guid: '', text: ''});
				// Update the tasks by changing the text on the one
				// TODO: Update this by changing the list object instead
				setItems(prevItems => {
					const sliced = prevItems.slice();
					const idx = sliced.findIndex(item => item.guid === guid);
					sliced[idx].name = text;
					return sliced;
				});
			}
		})();
	}, [ editedText, items, lists, activeList, user ]);

	/**
	 * Toggle complete logic
	 */
	useEffect(() => {
		if(itemToToggle === null || itemToToggle === undefined)
			return;

		(async() => {
			const copy = items.slice();
			try {
				let temp = copy.filter((val) => val.guid === itemToToggle.guid);
				if(temp.length === 0 || temp.length > 1) {
					console.error('Length too large');
				}

				const toggleOp = axios.post('/api/toggle_complete', { user: 'Custom', list: lists[activeList].name, task: itemToToggle.guid });
				temp[0].completed = !temp[0].completed;

				await toggleOp;
			}
			catch(err) {
				if (err.response) {
					// Request made and server responded
					console.log(err.response.data);
					console.log(err.response.status);
					console.log(err.response.headers);
				} 
				else if (err.request) {
					// The request was made but no response was received
					console.log(err.request);
				} 
				else {
					// Something happened in setting up the request that triggered an Error
					console.log('Error', err.message);
				}
			}
			finally {
				setItemToToggle(undefined);
				// TODO: Update the list object instead
				setItems(copy);
			}
		})();
	}, [itemToToggle, activeList, lists, items]);

	/**
	 * Delete item logic
	 */
	useEffect(() => {
		if(itemToDelete === null || itemToDelete === undefined)
			return;

		const copy = items.slice();
		(async() => {
			try {
				let itemIndex = copy.findIndex(val => val.guid === itemToDelete.guid);
				if(itemIndex === -1) {
					console.error('Item does not exist or duplicate detected. This should never happen.');
					return;
				}

				const deleteOp = axios.delete('/api/delete_item', { params: { user, list: lists[activeList].name, task: itemToDelete.guid }});

				copy.splice(itemIndex, 1);
				await deleteOp;
			}
			catch(err) {
				if (err.response) {
					// Request made and server responded
					console.log(err.response.data);
					console.log(err.response.status);
					console.log(err.response.headers);
				} 
				else if (err.request) {
					// The request was made but no response was received
					console.log(err.request);
				} 
				else {
					// Something happened in setting up the request that triggered an Error
					console.log('Error', err.message);
				}
			}
			finally {
				setItemToDelete(undefined);
				setLists((prevLists) => {
					const temp = prevLists.slice();
					temp[activeList].items = copy;
					return temp;
				});
				//setItems(copy);
			}
		})();
	}, [itemToDelete, activeList, lists, items, user]);

	async function GetUser(user: string) {
		console.log('Called get user');
		try {
			const response: AxiosResponse<ItemResponse> = await axios.get('/api/user', { params: {user}});
			
			sessionStorage.setItem('User', user);
			setUser(user);
			// Get the default list
			setLists(response.data.lists);
			setActiveList(0);
			//setItems(response.data.lists[0].items);
		}
		catch(err) {
			if (err.response) {
				// Request made and server responded
				console.log(err.response.data);
				console.log(err.response.status);
				console.log(err.response.headers);
			} 
			else if (err.request) {
				// The request was made but no response was received
				console.log(err.request);
			} 
			else {
				// Something happened in setting up the request that triggered an Error
				console.log('Error', err.message);
			}
		}
	}

	const CreateList = useCallback(async(listName: string) => {
		try {
			await axios.post('/api/add_list', { user, list: listName });

			// Refresh data and set as new list
			//const response: AxiosResponse<ItemResponse> = await axios.get('/api/user', { params: {user}});
			//const idx = response.data.lists.length - 1;
			setLists((prevLists) => {
				const slice = prevLists.slice();
				slice.push({
					name: listName,
					items: [],
				});
				return slice;
			});
			setActiveList(lists.length);
		}
		catch(err: any) {
			if (err.response) {
				// Request made and server responded
				console.log(err.response.data);
				console.log(err.response.status);
				console.log(err.response.headers);
			} 
			else if (err.request) {
				// The request was made but no response was received
				console.log(err.request);
			} 
			else {
				// Something happened in setting up the request that triggered an Error
				console.log('Error', err.message);
			}
		}
	}, [ user, lists ]);

	return (
		<Container>
			{
				loading &&
				<Loader />
			}
			{
				!loading && user === '' &&
				<div style={{paddingTop: 10}}>
					<h4>Type in a name and press enter. If the user already exists, you will be presented with their tasks. Otherwise, a new user will be created for you.</h4>
					<Input 
						fluid
						placeholder='Username'
						id='user_input'
					/>
				</div>
			}

			{
				!loading && user !== '' &&
				<div style={{paddingTop: 20}}>
					<h3>User: {user}</h3>
					<Grid>
						<Grid.Column width={14}>
							<ListLabel
								lists={
									lists.map(list => {return list.name})
								}
								activeList={activeList}
								CreateList={(newList) => CreateList(newList)}
								ChangeList={(newList: number) => setActiveList(newList)}
							/>
						</Grid.Column>
						<Grid.Column floated='right'>
							<Filter
								ApplyFilter={(x, y) => setFilterType(ExtractFilter(x, y))}
							/>
						</Grid.Column>
					</Grid>
					<SegmentGroup>
						<ListComponent 
							items={
								items
							}
							toggleComplete={setItemToToggle}
							deleteItem={setItemToDelete}
							editItem={(text: string, guid: string) => {
								setEditedText({text, guid})
							}}
						/>
						<Add 
							inputText={addText}
							setInput={setAddText}
						/>
					</SegmentGroup>
				</div>
			}
		</Container>
	);
}

function FetchFromStorage(key: string, number: boolean = false): string | number {
	const val = sessionStorage.getItem(key);
	if(number)
		return val ? parseInt(val) : 0;
	else
		return val ? val : '';
}

function ExtractFilter(showIncomplete: boolean, showComplete: boolean): FilterType {
	// Running XOR. If they are different, then filter.
	if(showIncomplete !== showComplete) {
		if(showIncomplete)
			return FilterType.Incomplete;
		return FilterType.Complete;
	}
	// Otherwise, show all
	return FilterType.All;
}