import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import React, { FC } from 'react';

import {
	getPoolHistoryForYear,
	TPoolHistory,
} from '../../api/collections/poolhistorys';
import Loading from '../pages/Loading';

export type TViewHistoryProps = {
	history: TPoolHistory[];
	pageReady: boolean;
};
export type TViewHistoryOuterProps = {
	currentLeague: string;
	year: number;
};

const ViewHistory: FC<TViewHistoryProps> = ({
	history,
	pageReady,
}): JSX.Element => {
	const _getLabel = ({ type, week }: TPoolHistory): string => {
		if (type === 'S') return 'Survivor';

		if (type === 'O') return 'Overall';

		return `${week}`;
	};

	return (
		<div className="row">
			{pageReady ? (
				<div className="col-12">
					<table className="table table-striped table-hover">
						<thead>
							<tr>
								<th>Week</th>
								<th>Place</th>
								<th>Player</th>
							</tr>
						</thead>
						<tbody>
							{history.map(
								(row): JSX.Element => {
									const user = row.getUser();

									return (
										<tr key={`history-${row._id}`}>
											<td>{row.place === 1 && _getLabel(row)}</td>
											<td>{row.place}</td>
											<td>{`${user.first_name} ${user.last_name}`}</td>
										</tr>
									);
								},
							)}
						</tbody>
					</table>
				</div>
			) : (
				<Loading />
			)}
		</div>
	);
};

ViewHistory.whyDidYouRender = true;

export default withTracker<TViewHistoryProps, TViewHistoryOuterProps>(
	({ currentLeague, year }): TViewHistoryProps => {
		const historyHandle = Meteor.subscribe(
			'poolHistoryForYear',
			currentLeague,
			year,
		);
		const historyReady = historyHandle.ready();
		let history = [];

		if (historyReady) {
			history = getPoolHistoryForYear.call({ league: currentLeague, year });
		}

		return {
			history,
			pageReady: historyReady,
		};
	},
)(ViewHistory);
