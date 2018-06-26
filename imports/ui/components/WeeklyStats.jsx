'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';
import { withTracker } from 'meteor/react-meteor-data';

import { Loading } from '../pages/Loading';
import StatsTeam from './StatsTeam';
import { currentWeek, getGamesForWeek } from '../../api/collections/games';
import { getAllPicksForWeek } from '../../api/collections/picks';
import { getAllTiebreakersForWeek, getTiebreaker } from '../../api/collections/tiebreakers';

const WeeklyStats = ({ canView, games, pageReady, picks, selectedWeek, tiebreakers }) => {
	const gamesForWeek = [];

	games.forEach(game => {
		gamesForWeek[game.game] = {
			home: game.home_short,
			homeTeam: game.getTeam('home'),
			visitor: game.visitor_short,
			visitorTeam: game.getTeam('visitor'),
			winner: game.winner_short,
			winnerTeam: game.winner_short ? game.getTeam('winner') : null,
			totalPicks: 0,
			totalPoints: 0,
			[`${game.home_short}-picks`]: 0,
			[`${game.visitor_short}-picks`]: 0,
			[`${game.home_short}-points`]: 0,
			[`${game.visitor_short}-points`]: 0
		};
	});
	picks.forEach(pick => {
		if (pick.pick_short && pick.points) {
			let gameObj = gamesForWeek[pick.game];
			gameObj[`${pick.pick_short}-picks`] += 1;
			gameObj.totalPicks += 1;
			gameObj[`${pick.pick_short}-points`] += pick.points;
			gameObj.totalPoints += pick.points;
		}
	});

	return (
		<div className="row">
			{pageReady ? (
				<div className="col-12">
					{canView ? (
						<table className="table table-striped table-hover">
							<thead>
								<tr>
									<th>Home</th>
									<th>Away</th>
								</tr>
							</thead>
							<tbody>
								{gamesForWeek.map((game, i) => (
									<tr key={`game-${i}`}>
										<td><StatsTeam gameStats={game} which="home" /></td>
										<td><StatsTeam gameStats={game} which="visitor" /></td>
									</tr>
								))}
							</tbody>
						</table>
					)
						:
						<div>You are not authorized to view this yet!  Please submit your picks for week {selectedWeek} and then try again</div>
					}
				</div>
			)
				:
				<Loading />
			}
		</div>
	);
};

WeeklyStats.propTypes = {
	canView: PropTypes.bool.isRequired,
	games: PropTypes.arrayOf(PropTypes.object).isRequired,
	pageReady: PropTypes.bool.isRequired,
	picks: PropTypes.arrayOf(PropTypes.object).isRequired,
	selectedWeek: PropTypes.number,
	tiebreakers: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default withTracker(({ currentLeague, selectedWeek }) => {
	const gamesHandle = Meteor.subscribe('gamesForWeek', selectedWeek),
			gamesReady = gamesHandle.ready(),
			picksHandle = Meteor.subscribe('allPicksForWeek', selectedWeek, currentLeague),
			picksReady = picksHandle.ready(),
			teamsHandle = Meteor.subscribe('allTeams'),
			teamsReady = teamsHandle.ready(),
			tiebreakersHandle = Meteor.subscribe('allTiebreakersForWeek', selectedWeek, currentLeague),
			tiebreakersReady = tiebreakersHandle.ready(),
			nflWeek = currentWeek.call({});
	let games = [],
			picks = [],
			tiebreakers = [],
			myTiebreaker = {};
	if (gamesReady) {
		games = getGamesForWeek.call({ week: selectedWeek });
	}
	if (picksReady) {
		picks = getAllPicksForWeek.call({ league: currentLeague, week: selectedWeek });
	}
	if (tiebreakersReady) {
		tiebreakers = getAllTiebreakersForWeek.call({ league: currentLeague, week: selectedWeek });
		myTiebreaker = getTiebreaker.call({ league: currentLeague, week: selectedWeek });
	}
	return {
		canView: myTiebreaker.submitted || selectedWeek < nflWeek,
		games,
		pageReady: gamesReady && picksReady && teamsReady && tiebreakersReady,
		picks,
		selectedWeek,
		tiebreakers
	};
})(WeeklyStats);
