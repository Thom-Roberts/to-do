import React, { useEffect, useState } from 'react';
import axios, { AxiosResponse } from 'axios';
import { Container, Input, Loader, SegmentGroup,  } from 'semantic-ui-react';
import List from './components/list';
import { Item, ItemResponse } from './interfaces/item';
import Add from './components/add';

export default function App() {
	const [ loading, setLoading ] = useState(true);
	const [ user, setUser ] = useState(FetchFromStorage());
	const [ items, setItems ] = useState<Item[]>([]);
	const [ addText, setAddText ] = useState(''); // Used for clearing text when a new item is added
	const [ itemToToggle, setItemToToggle ] = useState<Item>();
	const [ itemToDelete, setItemToDelete ] = useState<Item>();

	/**
	 * Fetch items on start
	 */
	useEffect(() => {
		(async() => {
			try {
				const itemsResponse: AxiosResponse<ItemResponse> = await axios.get('/api/items', { params: { user: 'Custom' } });
				setItems(itemsResponse.data.items);
			}
			catch(err) {
				console.error(err);
				alert('Something went wrong while trying to fetch your items. Please try again later.');
			}
			finally {
				setLoading(false);
			}
		})();
	}, []);

	/**
	 * Create user
	 */
	useEffect(() => {
		if(loading)
			return;

		const element = document.getElementById('first_id');
		if(!element)
			return;
		
		async function enterPressed(e: KeyboardEvent) {
			if(e.key === 'Enter' || e.keyCode === 13) {
				const input = document.getElementById('first_id') as HTMLInputElement;
				
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
	 *Add item logic
	 */
	useEffect(() => {
		// Can't add the logic unless it is active
		if(loading || user === '')
			return;

		let input = document.querySelector('input');
		
		async function enterPressed(e: KeyboardEvent) {
			if(e.key === 'Enter' || e.keyCode === 13) {
				let input = document.querySelector('input');
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
	}, [ loading, user ]);

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

				const toggleOp = axios.post('/api/toggle_complete', { user: 'Custom', task: itemToToggle.guid });
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
	}, [itemToToggle, items]);

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

				const deleteOp = axios.delete('/api/delete_item', { params: { user: 'Custom', task: itemToDelete.guid }});

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
	}, [itemToDelete, items]);

	async function handleAdd(val: string) {
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
			const guid: AxiosResponse<string> = await axios.post('/api/add_item', { user: 'Custom', task: val });
		
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
	}

	async function GetUser(user: string) {
		console.log('Called get user');
		try {
			const response: AxiosResponse<ItemResponse> = await axios.get('/api/user', { params: {user}});
			console.dir(response);
			sessionStorage.setItem('User', user);
			setUser(user);
			setItems(response.data.items);
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
					id='first_id'
				/>
			}

			{
				!loading && user !== '' &&
				<SegmentGroup>
					<List 
						items={
							items
						}
						toggleComplete={setItemToToggle}
						deleteItem={setItemToDelete}
					/>
					<Add 
						inputText={addText}
						setInput={setAddText}
					/>
				</SegmentGroup>
			}
		</Container>
	);
}

function FetchFromStorage(): string {
	const val = sessionStorage.getItem('User');
	return val ? val : '';
}