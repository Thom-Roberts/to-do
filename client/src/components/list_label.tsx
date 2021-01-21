import React, { useCallback, useEffect, useState } from 'react';
import { Button, Dropdown, DropdownItemProps, Icon, Input } from 'semantic-ui-react';

interface ListLabelProps {
	lists: string[];
	activeList: number;
	CreateList: CreateListFunction;
	ChangeList: Function;
}

interface CreateListFunction {
	(index: string) : void;
}

export default function ListLabel(props: ListLabelProps) {
	const { lists, activeList, CreateList, ChangeList } = props;

	const [ openListInput, setOpenListInput ] = useState(false);
	const [ text, setText ] = useState('');
	const [ currentValue, setCurrentValue ] = useState(lists[activeList]);
	const [ options, setOptions ] = useState<DropdownItemProps[]>(() => {
		return lists.map((list, idx) => {
			return {
				key: list,
				text: list,
				value: list
			};
		});
	});

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
				Submit(input.value);
			}
		}

		element.addEventListener('keydown', enterPressed);

		return () => element.removeEventListener('keydown', enterPressed);
// eslint-disable-next-line
	}, [ openListInput ]);

	/**
	 * Update the dropdown if the top level changes
	 */
	useEffect(() => {
		// A new list was created but activelist hasn't been updated yet
		if(lists.length < activeList)
			return;

		setOptions(() => {
			return lists.map((list, idx) => {
				return {
					key: list,
					text: list,
					value: list
				};
			}); 
		});
		setCurrentValue(lists[activeList]);
	}, [ lists, activeList ])

	const Submit = useCallback((txt) => {
		if(lists.findIndex((val) => val === txt) !== -1) {
			console.log('Duplicate list name exists.');
			return;
		}

		CreateList(txt);
		setOpenListInput(false);
		setText('');
		// eslint-disable-next-line
	}, [CreateList]);

	useEffect(() => {
		if(openListInput) {
			const input = document.getElementById('new_list_input') as HTMLInputElement;
			input.focus();
		}
		else {
			setText('');
		}
	}, [ openListInput ]);

	return (
		<div>
			<Dropdown
				selection
				options={options}
				placeholder={lists[activeList]}
				value={currentValue}
				onChange={(e, data) => ChangeList(lists.indexOf(data.value as string))}
			/>
			<span style={{padding: '0 5px'}} />
			<Button onClick={() => setOpenListInput(true)}>
				<Icon name='plus' /> Create List
			</Button>

			{
				openListInput &&
				<Input
					id='new_list_input'
					value={text}
					onChange={(e, data) => setText(data.value)}
					onBlur={() => setOpenListInput(false)}
				/>
			}
		</div>
	);
}