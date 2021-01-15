import React, { Fragment } from 'react';
import { Item } from '../interfaces/item';
import Task from './task';

interface ListProps {
	items: Item[];
	toggleComplete: Function;
	deleteItem: Function;
}

export default function List(props: ListProps) {
	const { items, toggleComplete, deleteItem } = props;
	return (	
		<Fragment>
			{
				items.map((item, idx) => {
					return (
						<Task 
							key={idx} 
							item={item}
							toggleComplete={() => toggleComplete(item)}
							deleteItem={() => deleteItem(item)}
						/>
					);
				})
			}
		</Fragment>
	);
}