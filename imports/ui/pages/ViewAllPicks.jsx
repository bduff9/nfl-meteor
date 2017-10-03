'use strict';

import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import '../../ui/pages/ViewAllPicksPrint.scss';

import { DEFAULT_LEAGUE } from '../../api/constants';
import { weekPlacer } from '../../api/global';
import { Loading } from './Loading.jsx';
import { getGamesForWeek } from '../../api/collections/games';
import { getCurrentUser } from '../../api/collections/users';
import { getTiebreaker, getAllTiebreakersForWeek } from '../../api/collections/tiebreakers';
import { getAllPicksForWeek } from '../../api/collections/picks';

class ViewAllPicks extends Component {
	constructor (props) {
		super();
		this.state = {
			games: [],
			users: []
		};
		this._resetPicks = this._resetPicks.bind(this);
		this._updateGame = this._updateGame.bind(this);
	}

	componentWillReceiveProps (nextProps) {
		const { currentWeek, games, pageReady, picks, selectedWeek, tiebreaker = {}, tiebreakers } = nextProps,
				notAllowed = pageReady && selectedWeek >= currentWeek && !tiebreaker.submitted;
		if (notAllowed) this.context.router.push('/picks/set');
		if (pageReady) this.setState({ games: games.map(game => Object.assign({}, game)), users: this._updateUsers({ games, picks, selectedWeek, tiebreakers }) });
	}

	_resetPicks (ev) {
		const { games, picks, selectedWeek, tiebreakers } = this.props;
		this.setState({ games: games.map(game => Object.assign({}, game)), users: this._updateUsers({ games, picks, selectedWeek, tiebreakers }) });
	}
	_updateGame (teamId, teamShort, i, ev) {
		const { games } = this.state,
				{ picks, selectedWeek, tiebreakers } = this.props;
		games[i].winner_id = teamId;
		games[i].winner_short = teamShort;
		this.setState({ games, users: this._updateUsers({ games, picks, selectedWeek, tiebreakers }) });
	}
	_updateUsers ({ games, picks, selectedWeek, tiebreakers }) {
		let newTiebreakers = tiebreakers.map(tiebreaker => {
			let newTiebreaker = Object.assign({}, tiebreaker),
					userPicks = picks.filter(pick => pick.user_id === newTiebreaker.user_id),
					pts = 0,
					gms = 0,
					game;
			newTiebreaker.full_name = tiebreaker.getFullName();
			userPicks.forEach((pick, i) => {
				game = games[i];
				if (game.winner_id && pick.pick_id === game.winner_id) {
					pts += pick.points;
					gms += 1;
				}
			});
			if (newTiebreaker) {
				newTiebreaker.points_earned = pts;
				newTiebreaker.games_correct = gms;
			}
			return newTiebreaker;
		});
		newTiebreakers.sort(weekPlacer.bind(null, selectedWeek));
		newTiebreakers.forEach((tiebreaker, i, allTiebreakers) => {
			let currPlace = i + 1,
					result, nextTiebreaker;
			if (!tiebreaker.tied_flag || i === 0) {
				tiebreaker.place_in_week = currPlace;
			} else {
				currPlace = tiebreaker.place_in_week;
			}
			nextTiebreaker = allTiebreakers[i + 1];
			if (nextTiebreaker) {
				result = weekPlacer(selectedWeek, tiebreaker, nextTiebreaker);
				if (result === 0) {
					tiebreaker.tied_flag = true;
					nextTiebreaker.place_in_week = currPlace;
					nextTiebreaker.tied_flag = true;
				} else {
					if (i === 0) tiebreaker.tied_flag = false;
					nextTiebreaker.tied_flag = false;
				}
			}
		});
		return newTiebreakers;
	}

	render () {
		const { games, users } = this.state,
				{ currentUser, pageReady, picks, selectedWeek } = this.props;
		return (
			<div className="row view-all-picks-wrapper">
				<Helmet title={`View All Week ${selectedWeek} Picks`} />
				<h3 className="title-text text-xs-center text-md-left hidden-md-up">{`View All Week ${selectedWeek} Picks`}</h3>
				{pageReady ? (
					<div className="col-xs-12 text-xs-left view-all-picks">
						<button type="button" className="btn btn-danger reset-picks" onClick={this._resetPicks}>
							<i className="fa fa-fw fa-refresh" />
							Reset Page
						</button>
						<button type="button" className="btn btn-primary hidden-sm-down print-page" onClick={window.print}>
							<i className="fa fa-fw fa-print" />
							Print this Page
						</button>
						<table className="table table-hover view-all-picks-table">
							<thead>
								<tr className="hide-for-print">
									<th colSpan={5 + games.length * 6}>
										Click the team names below to test &quot;what-if&quot; scenarios. To undo, click &apos;Reset Page&apos; above.
									</th>
								</tr>
								<tr>
									<th className="info-head">Name</th>
									{games.map((game, i) => {
										let cells = [];
										cells.push(
											<th className="visiting-team" colSpan={2} key={'team' + game.visitor_id}>
												<button className={'btn' + (game.visitor_id === game.winner_id ? ' btn-success' : (game.winner_id ? ' btn-danger' : ' btn-default'))} onClick={this._updateGame.bind(null, game.visitor_id, game.visitor_short, i)}>
													{game.visitor_short}
												</button>
												<div className={'show-for-print' + (game.visitor_id === game.winner_id ? ' text-success' : (game.winner_id ? ' text-danger' : ''))}>{game.visitor_short}</div>
											</th>
										);
										cells.push(
											<th className="team-separator" colSpan={2} key={'game' + game._id}>@</th>
										);
										cells.push(
											<th className="home-team" colSpan={2} key={'team' + game.home_id}>
												<button className={'btn' + (game.home_id === game.winner_id ? ' btn-success' : (game.winner_id ? ' btn-danger' : ' btn-default'))} onClick={this._updateGame.bind(null, game.home_id, game.home_short, i)}>
													{game.home_short}
												</button>
												<div className={'show-for-print' + (game.home_id === game.winner_id ? ' text-success' : (game.winner_id ? ' text-danger' : ''))}>{game.home_short}</div>
											</th>
										);
										return cells;
									})}
									<th className="info-head">Points Earned</th>
									<th className="info-head">Games Correct</th>
									<th className="info-head">My Tiebreaker Score</th>
									<th className="info-head">Last Game Score</th>
								</tr>
							</thead>
							<tbody>
								{users.map(tiebreaker => {
									return (
										<tr className={tiebreaker.user_id === currentUser._id ? 'my-user' : null} key={'user' + tiebreaker.user_id}>
											<td className="name-cell">{`${tiebreaker.tied_flag ? 'T' : ''}${tiebreaker.place_in_week}. ${tiebreaker.full_name}`}</td>
											{picks.filter(pick => pick.user_id === tiebreaker.user_id).map((pick, i) => {
												const game = games[i];
												let cells = [];
												cells.push(
													<td className={'text-xs-center visiting-team pick-points' + (game.winner_id ? (pick.pick_id === game.winner_id ? ' text-success' : ' text-danger') : '')} colSpan={3} key={'uservisitorpick' + pick._id}>
														{pick.pick_id && pick.pick_id === game.visitor_id ? pick.points : null}
													</td>
												);
												cells.push(
													<td className={'text-xs-center home-team pick-points' + (game.winner_id ? (pick.pick_id === game.winner_id ? ' text-success' : ' text-danger') : '')} colSpan={3} key={'userhomepick' + pick._id}>
														{pick.pick_id && pick.pick_id === game.home_id ? pick.points : null}
													</td>
												);
												return cells;
											})}
											<td className="text-xs-center pick-points">{tiebreaker.points_earned}</td>
											<td className="text-xs-center pick-points">{tiebreaker.games_correct}</td>
											<td className="text-xs-center pick-points">{tiebreaker.last_score}</td>
											<td className="text-xs-center pick-points">{tiebreaker.last_score_act}</td>
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
	}
}

ViewAllPicks.propTypes = {
	currentUser: PropTypes.object,
	currentWeek: PropTypes.number,
	games: PropTypes.arrayOf(PropTypes.object).isRequired,
	pageReady: PropTypes.bool.isRequired,
	picks: PropTypes.arrayOf(PropTypes.object).isRequired,
	selectedWeek: PropTypes.number,
	tiebreaker: PropTypes.object,
	tiebreakers: PropTypes.arrayOf(PropTypes.object).isRequired
};

ViewAllPicks.contextTypes = {
	router: PropTypes.object.isRequired
};

export default createContainer(() => {
	const currentUser = getCurrentUser.call({}),
			currentWeek = Session.get('currentWeek'),
			selectedWeek = Session.get('selectedWeek'),
			currentLeague = DEFAULT_LEAGUE, //Session.get('selectedLeague'), //TODO: Eventually will need to uncomment this and allow them to change current league
			tiebreakerHandle = Meteor.subscribe('singleTiebreakerForUser', selectedWeek, currentLeague),
			tiebreakerReady = tiebreakerHandle.ready(),
			picksHandle = Meteor.subscribe('allPicksForWeek', selectedWeek, currentLeague),
			picksReady = picksHandle.ready(),
			tiebreakersHandle = Meteor.subscribe('allTiebreakersForWeek', selectedWeek, currentLeague),
			tiebreakersReady = tiebreakersHandle.ready(),
			gamesHandle = Meteor.subscribe('gamesForWeek', selectedWeek),
			gamesReady = gamesHandle.ready(),
			teamsHandle = Meteor.subscribe('allTeams'),
			teamsReady = teamsHandle.ready(),
			usersHandle = Meteor.subscribe('basicUsersInfo'),
			usersReady = usersHandle.ready();
	let tiebreaker = {},
			tiebreakers = [],
			picks = [],
			games = [];
	if (tiebreakerReady) tiebreaker = getTiebreaker.call({ league: currentLeague, week: selectedWeek });
	if (gamesReady) games = getGamesForWeek.call({ week: selectedWeek });
	if (picksReady) picks = getAllPicksForWeek.call({ league: currentLeague, week: selectedWeek });
	if (tiebreakersReady) tiebreakers = getAllTiebreakersForWeek.call({ league: currentLeague, week: selectedWeek });
	return {
		currentUser,
		currentWeek,
		games,
		pageReady: gamesReady && picksReady && teamsReady && tiebreakerReady && tiebreakersReady && usersReady,
		picks,
		selectedWeek,
		tiebreaker,
		tiebreakers
	};
}, ViewAllPicks);
