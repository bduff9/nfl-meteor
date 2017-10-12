'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';
import { createContainer } from 'meteor/react-meteor-data';

import { Loading } from '../pages/Loading';
import { getPoolHistoryForYear } from '../../api/collections/poolhistorys';

const ViewHistory = ({ history, pageReady }) => {

	const _getLabel = ({ type, week }) => {
		if (type === 'S') return 'Survivor';
		if (type === 'O') return 'Overall';
		return week;
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
							{history.map(row => {
								const user = row.getUser();
								return (
									<tr key={`history-${row._id}`}>
										<td>{row.place === 1 ? _getLabel(row) : null}</td>
										<td>{row.place}</td>
										<td>{`${user.first_name} ${user.last_name}`}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)
				:
				<Loading />
			}
		</div>
	);
};

ViewHistory.propTypes = {
	history: PropTypes.arrayOf(PropTypes.object).isRequired,
	pageReady: PropTypes.bool.isRequired
};

export default createContainer(({ currentLeague, year }) => {
	const historyHandle = Meteor.subscribe('poolHistoryForYear', currentLeague, year),
			historyReady = historyHandle.ready();
	let history = [];
	if (historyReady) {
		history = getPoolHistoryForYear.call({ league: currentLeague, year });
	}
	return {
		history,
		pageReady: historyReady
	};
}, ViewHistory);
