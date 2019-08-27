import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import React, { FC } from 'react';

import {
	currentWeek,
	getGamesForWeek,
	TGame,
} from '../../api/collections/games';
import { getAllPicksForWeek, TPick } from '../../api/collections/picks';
import { TTeam } from '../../api/collections/teams';
import {
	getAllTiebreakersForWeek,
	getTiebreaker,
	TTiebreaker,
} from '../../api/collections/tiebreakers';
import { TWeek } from '../../api/commonTypes';
import Loading from '../pages/Loading';

import StatsTeam from './StatsTeam';

export type TWeeklyStatsOuterProps = {
	currentLeague: string;
	selectedWeek: TWeek;
};
export type TWeeklyStatsProps = {
	canView: boolean;
	games: TGame[];
	pageReady: boolean;
	picks: TPick[];
	selectedWeek: TWeek;
	tiebreakers: TTiebreaker[];
};
export type TGameStat = {
	gameID: string;
	home: string;
	homeTeam: TTeam | null;
	visitor: string;
	visitorTeam: TTeam | null;
	winner: string | null;
	winnerTeam: TTeam | null;
	totalPicks: number;
	totalPoints: number;
} & {
	[k: string]: number;
};

const WeeklyStats: FC<TWeeklyStatsProps> = ({
	canView,
	games,
	pageReady,
	picks,
	selectedWeek,
}): JSX.Element => {
	const gamesForWeek: TGameStat[] = [];

	games.forEach(
		(game): void => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			gamesForWeek[game.game] = {
				gameID: game._id,
				home: game.home_short,
				homeTeam: game.getTeam('home'),
				visitor: game.visitor_short,
				visitorTeam: game.getTeam('visitor'),
				winner: game.winner_short || null,
				winnerTeam: game.winner_short ? game.getTeam('winner') : null,
				totalPicks: 0,
				totalPoints: 0,
				[`${game.home_short}-picks`]: 0,
				[`${game.visitor_short}-picks`]: 0,
				[`${game.home_short}-points`]: 0,
				[`${game.visitor_short}-points`]: 0,
			};
		},
	);
	picks.forEach(
		(pick): void => {
			if (pick.pick_short && pick.points) {
				const gameObj = gamesForWeek[pick.game];

				gameObj[`${pick.pick_short}-picks`] += 1;
				gameObj.totalPicks += 1;
				gameObj[`${pick.pick_short}-points`] += pick.points;
				gameObj.totalPoints += pick.points;
			}
		},
	);

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
								{gamesForWeek.map(
									(game): JSX.Element => (
										<tr key={`game-${game.gameID}`}>
											<td>
												<StatsTeam gameStats={game} which="home" />
											</td>
											<td>
												<StatsTeam gameStats={game} which="visitor" />
											</td>
										</tr>
									),
								)}
							</tbody>
						</table>
					) : (
						<div>
							You are not authorized to view this yet! Please submit your picks
							for week {selectedWeek} and then try again
						</div>
					)}
				</div>
			) : (
				<Loading />
			)}
		</div>
	);
};

WeeklyStats.whyDidYouRender = true;

export default withTracker<TWeeklyStatsProps, TWeeklyStatsOuterProps>(
	({ currentLeague, selectedWeek }): TWeeklyStatsProps => {
		const gamesHandle = Meteor.subscribe('gamesForWeek', selectedWeek);
		const gamesReady = gamesHandle.ready();
		const picksHandle = Meteor.subscribe(
			'allPicksForWeek',
			selectedWeek,
			currentLeague,
		);
		const picksReady = picksHandle.ready();
		const teamsHandle = Meteor.subscribe('allTeams');
		const teamsReady = teamsHandle.ready();
		const tiebreakersHandle = Meteor.subscribe(
			'allTiebreakersForWeek',
			selectedWeek,
			currentLeague,
		);
		const tiebreakersReady = tiebreakersHandle.ready();
		const nflWeek = currentWeek.call({});
		let games: TGame[] = [];
		let picks: TPick[] = [];
		let tiebreakers: TTiebreaker[] = [];
		let myTiebreaker: TTiebreaker = {} as any;

		if (gamesReady) {
			games = getGamesForWeek.call({ week: selectedWeek });
		}

		if (picksReady) {
			picks = getAllPicksForWeek.call({
				league: currentLeague,
				week: selectedWeek,
			});
		}

		if (tiebreakersReady) {
			tiebreakers = getAllTiebreakersForWeek.call({
				league: currentLeague,
				week: selectedWeek,
			});
			myTiebreaker = getTiebreaker.call({
				league: currentLeague,
				week: selectedWeek,
			});
		}

		return {
			canView: myTiebreaker.submitted || selectedWeek < nflWeek,
			games,
			pageReady: gamesReady && picksReady && teamsReady && tiebreakersReady,
			picks,
			selectedWeek,
			tiebreakers,
		};
	},
)(WeeklyStats);
