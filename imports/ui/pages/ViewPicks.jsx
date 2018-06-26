'use strict';

import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Session } from 'meteor/session';
import { withTracker } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import '../../ui/pages/ViewPicksPrint.scss';

import { DEFAULT_LEAGUE } from '../../api/constants';
import { Loading } from './Loading.jsx';
import { getGamesForWeekSync } from '../../api/collections/games';
import { getTiebreakerSync } from '../../api/collections/tiebreakers';
import { getPicksForWeekSync } from '../../api/collections/picks';

class ViewPicks extends Component {
	constructor (props) {
		super(props);
		this.state = {};
	}

	render () {
		const { games, pageReady, picks, selectedWeek, tiebreaker } = this.props,
				maxPoints = (games.length * (games.length + 1)) / 2,
				possiblePoints = picks.reduce((prevScore, pick) => {
					if ((pick.winner_id && pick.pick_id === pick.winner_id) || (!pick.winner_id && pick.pick_id)) return prevScore + pick.points;
					return prevScore;
				}, 0);
		return (
			<div className="view-picks-wrapper">
				<Helmet title={`View My Picks for Week ${selectedWeek}`} />
				<h3 className="title-text text-center text-md-left d-md-none">{`View My Picks for Week ${selectedWeek}`}</h3>
				<button type="button" className="btn btn-primary d-none d-md-block print-page" onClick={window.print}>
					<i className="fa fa-fw fa-print" />
					Print this Page
				</button>
				{pageReady ? [
					<table className="table table-hover view-picks-table" key="view-picks-table">
						<thead className="thead-default">
							<tr>
								<th>Games</th>
								<th>My Pick</th>
								<th>Wager</th>
								<th>Winner</th>
							</tr>
						</thead>
						<tbody>
							{games.map((game, i) => {
								const homeTeam = game.getTeam('home'),
										visitTeam = game.getTeam('visitor'),
										thisPick = picks[i];
								return (
									<tr key={'game' + i}>
										<td>{`${visitTeam.city} ${visitTeam.name} @ ${homeTeam.city} ${homeTeam.name}`}</td>
										<td className={game.winner_short ? (thisPick.pick_short === game.winner_short ? 'correct-pick' : 'incorrect-pick') : null}>{thisPick.pick_short}</td>
										<td className={game.winner_short ? (thisPick.pick_short === game.winner_short ? 'correct-pick' : 'incorrect-pick') : null}>{thisPick.points}</td>
										<td>
											{game.winner_short}
											{game.winner_short ? <i className={'fa fa-fw' + (thisPick.pick_short === game.winner_short ? ' fa-check text-success' : ' fa-times text-danger')} /> : null}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>,
					<table className="table table-hover view-pick-results-table" key="view-pick-results-table">
						<thead className="thead-default">
							<tr>
								<th colSpan={2}>My Results</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>{`Week ${selectedWeek} score`}</td>
								<td>{tiebreaker.points_earned}/{maxPoints}</td>
							</tr>
							<tr>
								<td>Games picked correctly</td>
								<td>{tiebreaker.games_correct}/{games.length}</td>
							</tr>
							<tr>
								<td>Maximum possible score</td>
								<td>{possiblePoints}</td>
							</tr>
							<tr>
								<td>My tiebreaker score</td>
								<td>{tiebreaker.last_score}</td>
							</tr>
							<tr>
								<td>Final game&apos;s total</td>
								<td>{tiebreaker.last_score_act}</td>
							</tr>
						</tbody>
					</table>
				]
					:
					<Loading />
				}
			</div>
		);
	}
}

ViewPicks.propTypes = {
	games: PropTypes.arrayOf(PropTypes.object).isRequired,
	pageReady: PropTypes.bool.isRequired,
	picks: PropTypes.arrayOf(PropTypes.object).isRequired,
	selectedWeek: PropTypes.number,
	tiebreaker: PropTypes.object
};

export default withTracker(() => {
	const selectedWeek = Session.get('selectedWeek'),
			currentLeague = DEFAULT_LEAGUE, //Session.get('selectedLeague'), //TODO: Eventually will need to uncomment this and allow them to change current league
			picksHandle = Meteor.subscribe('singleWeekPicksForUser', selectedWeek, currentLeague),
			picksReady = picksHandle.ready(),
			tiebreakersHandle = Meteor.subscribe('singleTiebreakerForUser', selectedWeek, currentLeague),
			tiebreakersReady = tiebreakersHandle.ready(),
			gamesHandle = Meteor.subscribe('gamesForWeek', selectedWeek),
			gamesReady = gamesHandle.ready(),
			teamsHandle = Meteor.subscribe('allTeams'),
			teamsReady = teamsHandle.ready();
	let games = [],
			picks = [],
			tiebreaker = {};
	if (gamesReady) games = getGamesForWeekSync({ week: selectedWeek });
	if (picksReady) picks = getPicksForWeekSync({ league: currentLeague, week: selectedWeek });
	if (tiebreakersReady) tiebreaker = getTiebreakerSync({ league: currentLeague, week: selectedWeek });
	return {
		games,
		pageReady: gamesReady && picksReady && teamsReady && tiebreakersReady,
		picks,
		selectedWeek,
		tiebreaker
	};
})(ViewPicks);
