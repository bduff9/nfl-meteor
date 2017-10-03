'use strict';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { DEFAULT_LEAGUE, WEEKS_IN_SEASON } from '../../api/constants';
import { handleError } from '../../api/global';
import { Loading } from './Loading.jsx';
import OverallDash from '../components/OverallDash.jsx';
import WeekDash from '../components/WeekDash.jsx';
import { updateSelectedWeek } from '../../api/collections/users';

class Dashboard extends Component {
	constructor (props) {
		super();
		this.state = {
			sortBy: null,
			viewOverall: false
		};
		this._changeSortBy = this._changeSortBy.bind(this);
		this._toggleOverall = this._toggleOverall.bind(this);
	}

	_changeSortBy (currSort, col, ev) {
		const { viewOverall } = this.state,
				newSort = Object.assign({}, currSort),
				{ total_games, total_points, games_correct: week_games, points_earned: week_points } = newSort;
		if (col === 'games') {
			if (viewOverall) {
				newSort.total_games = this._nextOrd(total_games, total_points);
			} else {
				newSort.games_correct = this._nextOrd(week_games, week_points);
			}
		} else if (col === 'points') {
			if (viewOverall) {
				newSort.total_points = this._nextOrd(total_points, total_games);
			} else {
				newSort.points_earned = this._nextOrd(week_points, week_games);
			}
		}
		this.setState({ sortBy: newSort });
	}
	_nextOrd (num, otherNum) {
		if (num === 1) {
			return -1;
		} else if (num === -1 && otherNum) {
			return undefined;
		} else {
			return 1;
		}
	}
	_selectWeek (ev) {
		const newWeek = parseInt(ev.currentTarget.value, 10);
		ev.preventDefault();
		updateSelectedWeek.call({ week: newWeek }, handleError);
	}
	_toggleOverall (ev) {
		const viewOverall = ev.currentTarget.value === 'true';
		this.setState({ sortBy: null, viewOverall });
	}

	render () {
		const { sortBy, viewOverall } = this.state,
				{ currentLeague, pageReady, selectedWeek } = this.props;
		return (
			<div className="row dashboard-wrapper">
				<Helmet title={'My Dashboard'} />
				<h3 className="title-text text-xs-center text-md-left hidden-md-up">My Dashboard</h3>
				{pageReady ? (
					<div className="col-xs-12 dashboard">
						<div className="col-xs-6">
							<div className="form-group">
								<label htmlFor="view-overall">View:</label>
								<select className="form-control" id="view-overall" value={'' + viewOverall} onChange={this._toggleOverall}>
									<option value="true">Overall</option>
									<option value="false">Week</option>
								</select>
							</div>
						</div>
						{!viewOverall ? (
							<div className="col-xs-6">
								<div className="form-group">
									<label htmlFor="select-week-for-dashboard">Jump to:</label>
									<select className="form-control" value={selectedWeek} onChange={this._selectWeek}>
										{[...Array(WEEKS_IN_SEASON)].map((UU, i) => <option value={i + 1} key={'week' + (i + 1)}>{`Week ${i + 1}`}</option>)}
									</select>
								</div>
							</div>
						)
							:
							null
						}
						{viewOverall ?
							<OverallDash
								league={currentLeague}
								sortBy={sortBy}
								_changeSortBy={this._changeSortBy} />
							:
							<WeekDash
								league={currentLeague}
								sortBy={sortBy}
								week={selectedWeek}
								_changeSortBy={this._changeSortBy} />
						}
					</div>
				)
					:
					<Loading />
				}
			</div>
		);
	}
}

Dashboard.propTypes = {
	currentLeague: PropTypes.string.isRequired,
	pageReady: PropTypes.bool.isRequired,
	selectedWeek: PropTypes.number
};

export default createContainer(() => {
	const selectedWeek = Session.get('selectedWeek'),
			currentLeague = DEFAULT_LEAGUE; //Session.get('selectedLeague'); //TODO: Eventually will need to uncomment this and allow them to change current league
	return {
		currentLeague,
		pageReady: !!selectedWeek,
		selectedWeek
	};
}, Dashboard);
