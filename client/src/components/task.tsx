import React, { useCallback, useEffect, useState } from 'react';
import { Grid, Icon, Input, Segment } from 'semantic-ui-react';
import { Item } from '../interfaces/item';

import '../styles/task.css';

interface ItemProps {
	item: Item;
	toggleComplete: Function;
	deleteItem: Function;
	doEdit: EditFunc;
}

interface EditFunc {
	(task: string, guid: string) : void;
}

export default function Task(props: ItemProps) {
	const { item, toggleComplete, deleteItem, doEdit } = props;
	const [ text, setText ] = useState(item.name);

	const enterPressed = useCallback((e: KeyboardEvent) => {
		if(e.key === 'Enter' || e.keyCode === 13) {		
			const input = document.getElementById(item.guid as string) as HTMLInputElement;
			
			// Don't add an empty item
			if(input.value === '' || input?.value === undefined)
				return;
			
			doEdit(input.value, item.guid as string);
		}
	}, [ doEdit, item ]); 

	useEffect(() => {	
		const element = document.getElementById(item.guid as string);
		
		if(!element) {
			console.error('Failed to find text input for item')
			console.log(item);
			return;
		}
		
		element.addEventListener('keydown', enterPressed);

		return () => element.removeEventListener('keydown', enterPressed);
		// Leaving out enterPressed dependency for now, still need to figure out how to not call multiple times
		// eslint-disable-next-line
	}, [ item ]);

	// Update text when top level changes
	useEffect(() => {
		setText(item.name);
	}, [item])

	return (
		<Segment>
			<Grid>
				<Grid.Column width={1}>
					<Icon 
						name={item.completed ? 'check circle' : 'circle outline'}
						color={item.completed ? 'green' : 'grey'} 
						size='large'
						onClick={toggleComplete}
					/>
				</Grid.Column>
				<Grid.Column width={14}>
					<Input
						id={item.guid}
						fluid
						transparent
						value={text}
						//defaultValue={text}
						onChange={(e, data) => setText(data.value)}
					/>
				</Grid.Column>
				<Grid.Column width={1}>
					<Icon
						name='trash'
						size='large'
						onClick={deleteItem}
						className='custom_trash_icon'
					/>
				</Grid.Column>
			</Grid>
		</Segment>
	)
}