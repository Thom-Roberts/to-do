import React, { useCallback, useEffect, useState } from 'react';
import axios, { AxiosResponse } from 'axios';
import { Container, Input, Loader, SegmentGroup,  } from 'semantic-ui-react';
import ListComponent from './components/list';
import { Item, ItemResponse, List } from './interfaces/item';
import Add from './components/add';
import ListLabel from './components/list_label';

export default function App() {
	const [ loading, setLoading ] = useState(true);
	const [ user, setUser ] = useState(FetchFromStorage());
	const [ lists, setLists ] = useState<List[]>([]);
	const [ activeList, setActiveList ] = useState<number>(-1);
	const [ items, setItems ] = useState<Item[]>([]);
	const [ addText, setAddText ] = useState(''); // Used for clearing text when a new item is added
	const [ editedText, setEditedText ] = useState<{text: string, guid: string}>();
	const [ itemToToggle, setItemToToggle ] = useState<Item>();
	const [ itemToDelete, setItemToDelete ] = useState<Item>();

	/**
	 * Fetch items on start if user is present
	 */
	useEffect(() => {
		(async() => {
			if(user === '')
				return;
			try {
				const itemsResponse: AxiosResponse<ItemResponse> = await axios.get('/api/items', { params: { user: 'Custom' } });
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

	const handleAdd = useCallback(async (val: string) => {
		console.log('Called handle add');
		// Add it to the list of items
		setItems((prevItems) => {
			const copy = prevItems.slice();
			copy.push({
				name: val,
				completed: false,
			});
			return copy;
		});
		
		try {
			// Attempt to communicate with the server
			const guid: AxiosResponse<string> = await axios.post('/api/add_item', { user: 'Custom', list: lists[activeList].name, task: val });
		
			setItems(prevItems => {
				const copy = prevItems.slice();
				const idx = copy.findIndex(item => item.name === val);
				copy[idx].guid = guid.data;
				return copy;
			});
		}
		catch(err) {
			console.error(err);
		}
		finally {
			// Clear the Add component	
			setAddText('');
		}
	}, [ activeList ]);

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
			console.log('Removing event listener');
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
				console.error('Unable to update to-do item.');
				console.error(err);
			}
			finally {
				setEditedText({guid: '', text: ''});
				// Update the tasks by changing the text on the one
				setItems(prevItems => {
					const sliced = prevItems.slice();
					const idx = sliced.findIndex(item => item.guid === guid);
					sliced[idx].name = text;
					return sliced;
				});
			}
		})();
	}, [ editedText, items, activeList, user ]);

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
				console.error(err);
			}
			finally {
				setItemToToggle(undefined);
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

				const deleteOp = axios.delete('/api/delete_item', { params: { user: 'Custom', list: activeList, task: itemToDelete.guid }});

				copy.splice(itemIndex, 1);
				await deleteOp;
			}
			catch(err) {
				console.error(err);
			}
			finally {
				setItemToDelete(undefined);
				setItems(copy);
			}
		})();
	}, [itemToDelete, activeList, items]);

	async function GetUser(user: string) {
		console.log('Called get user');
		try {
			const response: AxiosResponse<ItemResponse> = await axios.get('/api/user', { params: {user}});
			console.dir(response);
			sessionStorage.setItem('User', user);
			setUser(user);
			// Get the default list
			setActiveList(0);
			setItems(response.data.lists[0].items);
		}
		catch(err) {
			console.error(err);
		}
	}

	return (
		<Container>
			{
				loading &&
				<Loader />
			}
			{
				!loading && user === '' &&
				<Input 
					placeholder='Username'
					id='user_input'
				/>
			}

			{
				!loading && user !== '' &&
				<div style={{paddingTop: 20}}>
					<h3>{user}</h3>
					<ListLabel
						lists={
							lists.map(list => {return list.name})
						}
						activeList={activeList}
						CreateList={(newListIndex) => setActiveList(newListIndex)}
					/>
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

function FetchFromStorage(): string {
	const val = sessionStorage.getItem('User');
	return val ? val : '';
}