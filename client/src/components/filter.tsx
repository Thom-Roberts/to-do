import React, { Fragment, useEffect, useState } from 'react';
import { Button, Checkbox, Popup } from 'semantic-ui-react';

interface FilterProps {
	ApplyFilter: FilterFunc;
}

interface FilterFunc {
	(showIncomplete: boolean, showComplete: boolean) : void;
}

export default function Filter(props: FilterProps) {
	const { ApplyFilter } = props;
	const [ checkedStates, setCheckedStates ] = useState([true, true]);

	/**
	 * Let the top level know when a change in the filter occurs
	 */
	useEffect(() => {
		ApplyFilter(checkedStates[0], checkedStates[1]);
	}, [ checkedStates ]);

	function flipCheck(idx: number) {
		setCheckedStates(prevStates => {
			const temp = prevStates.slice();
			temp[idx] = !temp[idx];
			// Won't allow both to be unchecked. If it is going to be, enable both so "all" show
			if(temp.every(val => val === false))
				return [ true, true ];
			return temp;
		});
	}

	return (
		<Popup
			trigger={
				<Button icon='filter' />
			}
			on={'click'}
			content={
				<Fragment>
					<div>
						<Checkbox
							label='Incomplete'
							checked={checkedStates[0]}
							onChange={() => flipCheck(0)}
						/>
					</div>
					<div>
						<Checkbox
							label='Completed'
							checked={checkedStates[1]}
							onChange={() => flipCheck(1)}
						/>
					</div>
				</Fragment>
			}
		/>
	);
}