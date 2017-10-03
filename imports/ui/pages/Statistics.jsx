'use strict';

import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { DEFAULT_LEAGUE } from '../../api/constants';
import { Loading } from '../pages/Loading';
import ViewHistory from '../components/ViewHistory';
import WeeklyStats from '../components/WeeklyStats';
import { getUsers } from '../../api/collections/users';

class Statistics extends Component {
	constructor (props) {
		super();
		this.state = {
			display: ''
		};
	}

	render () {
		const { currentLeague, pageReady, poolYears, selectedWeek } = this.props,
				{ display } = this.state,
				pageTitle = 'Pool Stats';
		return (
			<div className="row statistics-wrapper">
				<Helmet title={pageTitle} />
				<h3 className="title-text text-xs-center text-md-left hidden-md-up">{pageTitle}</h3>
				{pageReady ? (
					<div className="col-xs-12 statistics">
						<select className="form-control" value={display} onChange={(ev) => this.setState({ display: ev.currentTarget.value })}>
							<option value="">Current Year (Week {selectedWeek})</option>
							{poolYears.map(year => <option value={year} key={`year-${year}`}>{year}</option>)}
						</select>
						{display === '' ? <WeeklyStats currentLeague={currentLeague} selectedWeek={selectedWeek} /> : <ViewHistory currentLeague={currentLeague} year={parseInt(display, 10)} />}
					</div>
				)
					:
					<Loading />
				}
			</div>
		);
	}
}

Statistics.propTypes = {
	currentLeague: PropTypes.string.isRequired,
	pageReady: PropTypes.bool.isRequired,
	poolYears: PropTypes.arrayOf(PropTypes.number).isRequired,
	selectedWeek: PropTypes.number
};

export default createContainer(() => {
	const selectedWeek = Session.get('selectedWeek'),
			currentLeague = DEFAULT_LEAGUE, //Session.get('selectedLeague'); //TODO: Eventually will need to uncomment this and allow them to change current league
			usersHandle = Meteor.subscribe('usersForHistory'),
			usersReady = usersHandle.ready();
	let poolYears = [];
	if (usersReady) {
		let allUsers = getUsers.call({ activeOnly: true, league: currentLeague });
		poolYears = allUsers.reduce((years, user) => user.years_played.concat(years), []).filter((year, i, allYears) => allYears.indexOf(year) === i).sort().reverse().slice(1);
	}
	return {
		currentLeague,
		pageReady: !!selectedWeek && usersReady,
		poolYears,
		selectedWeek
	};
}, Statistics);
