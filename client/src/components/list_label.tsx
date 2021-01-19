import React, { useCallback, useEffect, useState } from 'react';
import { Button, Icon, Input } from 'semantic-ui-react';

interface ListLabelProps {
	lists: string[];
	activeList: number;
	CreateList: CreateListFunction;
}

interface CreateListFunction {
	(index: number) : void;
}

export default function ListLabel(props: ListLabelProps) {
	const { lists, activeList, CreateList } = props;

	const [ openListInput, setOpenListInput ] = useState(false);
	const [ text, setText ] = useState('');

	// Listen for enter if the input is active
	useEffect(() => {
		if(!openListInput)
			return;
		
		const element = document.getElementById('new_list_input');
		if(!element)
			return;
		
		async function enterPressed(e: KeyboardEvent) {
			if(e.key === 'Enter' || e.keyCode === 13) {
				const input = document.getElementById('new_list_input') as HTMLInputElement;
				
				// Don't add an empty item
				if(input.value === '' || input?.value === undefined)
					return;
				
				Submit();
			}
		}

		element.addEventListener('keydown', enterPressed);

		return () => element.removeEventListener('keydown', enterPressed);

	}, [ openListInput ]);

	const Submit = useCallback(() => {
		CreateList(lists.indexOf(text));
		setOpenListInput(false);
		setText('');
	}, [lists, text]);

	return (
		<div>
			
			<h4>{lists[activeList]}</h4>
			<Button onClick={() => setOpenListInput(true)}>
				<Icon name='plus' />
			</Button>

			{
				openListInput &&
				<Input
					id='new_list_input'
					value={text}
					onChange={(e, data) => setText(data.value)}
				/>
			}
		</div>
	);
}