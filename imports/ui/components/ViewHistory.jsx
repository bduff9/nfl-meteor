'use strict';

import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';

import { getUsers } from '../../api/collections/users';

class ViewHistory extends Component {
	constructor (props) {
		super();
		this.state = {};
	}

	render () {
		const { pageReady, year } = this.props;
		return (
			<div className="row">
				{pageReady ? (
					<div className="col-xs-12">
						TODO: History for {year}
					</div>
				)
					:
					null
				}
			</div>
		);
	}
}

ViewHistory.propTypes = {
	currentLeague: PropTypes.string.isRequired,
	pageReady: PropTypes.bool.isRequired,
	users: PropTypes.array.isRequired,
	year: PropTypes.number.isRequired
};

export default createContainer(({ currentLeague, year }) => {
	const users = getUsers.call({ league: currentLeague });
	//TODO: subscribe to data for pool history
	return {
		currentLeague,
		pageReady: true,
		users,
		year
	};
}, ViewHistory);
