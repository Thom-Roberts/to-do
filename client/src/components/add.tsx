import React from 'react';
import { Input, Segment } from 'semantic-ui-react';

interface AddProps {
	inputText: string;
	setInput: Function;
}

export default function Add(props: AddProps) {
	const { inputText, setInput } = props;

	return (
		<Segment>
			<Input
				id='new_task_input'
				icon='plus'
				transparent
				fluid
				placeholder='New task'
				value={inputText}
				onChange={(e, data) => setInput(data.value)}
			/>
		</Segment>
	);
}