'use strict';

import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';

import { Loading } from '../pages/Loading';
import { getUsers } from '../../api/collections/users';

class WeeklyStats extends Component {
	constructor (props) {
		super();
		this.state = {};
	}

	render () {
		const { pageReady, selectedWeek } = this.props;
		return (
			<div className="row">
				{pageReady ? (
					<div className="col-xs-12">
						TODO: Weekly stats for week {selectedWeek}
					</div>
				)
					:
					null
				}
			</div>
		);
	}
}

WeeklyStats.propTypes = {
	currentLeague: PropTypes.string.isRequired,
	pageReady: PropTypes.bool.isRequired,
	selectedWeek: PropTypes.number,
	users: PropTypes.array.isRequired
};

export default createContainer(({ currentLeague, selectedWeek }) => {
	const users = getUsers.call({ activeOnly: true, league: currentLeague });
	//TODO: subscribe to games, picks and tiebreakers for selectedWeek
	//TODO: get if submitted or if this week has passed for security
	return {
		currentLeague,
		pageReady: true,
		selectedWeek,
		users
	};
}, WeeklyStats);
