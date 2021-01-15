import React from 'react';
import { Grid, Icon, Segment } from 'semantic-ui-react';
import { Item } from '../interfaces/item';

import '../styles/task.css';

interface ItemProps {
	item: Item;
	toggleComplete: Function;
	deleteItem: Function;
}

export default function Task(props: ItemProps) {
	const { item, toggleComplete, deleteItem } = props;

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
					{item.name}
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