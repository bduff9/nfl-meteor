import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import React, { FC } from 'react';
import Helmet from 'react-helmet';

import '../../ui/pages/ViewPicksPrint.scss';

import { getGamesForWeekSync, TGame } from '../../api/collections/games';
import { getPicksForWeekSync, TPick } from '../../api/collections/picks';
import { TTeam } from '../../api/collections/teams';
import {
	getTiebreakerSync,
	TTiebreaker,
} from '../../api/collections/tiebreakers';
import { DEFAULT_LEAGUE } from '../../api/constants';

import Loading from './Loading';

export type TViewPicksProps = {
	games: TGame[];
	pageReady: boolean;
	picks: TPick[];
	selectedWeek: number;
	tiebreaker: TTiebreaker;
};

const ViewPicks: FC<TViewPicksProps> = ({
	games,
	pageReady,
	picks,
	selectedWeek,
	tiebreaker,
}): JSX.Element => {
	const maxPoints = (games.length * (games.length + 1)) / 2;
	const possiblePoints = picks.reduce((prevScore, pick): number => {
		if (
			(pick.winner_id && pick.pick_id === pick.winner_id) ||
			(!pick.winner_id && pick.pick_id)
		)
			return prevScore + (pick.points || 0);

		return prevScore;
	}, 0);

	return (
		<div className="view-picks-wrapper">
			<Helmet title={`View My Picks for Week ${selectedWeek}`} />
			<h3 className="title-text text-center col-12 d-md-none">{`My Picks for Week ${selectedWeek}`}</h3>
			<button
				type="button"
				className="btn btn-primary d-none d-md-inline-block d-print-none print-page"
				onClick={window.print}
			>
				<FontAwesomeIcon icon={['fad', 'print']} fixedWidth />
				Print this Page
			</button>
			{pageReady ? (
				<>
					<table
						className="table table-hover view-picks-table"
						key="view-picks-table"
					>
						<thead className="thead-default">
							<tr>
								<th>Games</th>
								<th>My Pick</th>
								<th>Wager</th>
								<th>Winner</th>
							</tr>
						</thead>
						<tbody>
							{games.map(
								(game, i): JSX.Element => {
									const homeTeam = game.getTeam('home') as TTeam;
									const visitTeam = game.getTeam('visitor') as TTeam;
									const thisPick = picks[i];

									return (
										<tr key={`game-${game._id}`}>
											<td>{`${visitTeam.city} ${visitTeam.name} @ ${
												homeTeam.city
											} ${homeTeam.name}`}</td>
											<td
												className={
													game.winner_short
														? thisPick.pick_short === game.winner_short
															? 'correct-pick'
															: 'incorrect-pick'
														: undefined
												}
											>
												{thisPick.pick_short}
											</td>
											<td
												className={
													game.winner_short
														? thisPick.pick_short === game.winner_short
															? 'correct-pick'
															: 'incorrect-pick'
														: undefined
												}
											>
												{thisPick.points}
											</td>
											<td>
												{game.winner_short}
												{game.winner_short &&
													(thisPick.pick_short === game.winner_short ? (
														<FontAwesomeIcon
															className="text-success"
															icon={['fad', 'check']}
															fixedWidth
														/>
													) : (
														<FontAwesomeIcon
															className="text-danger"
															icon={['fad', 'times']}
															fixedWidth
														/>
													))}
											</td>
										</tr>
									);
								},
							)}
						</tbody>
					</table>
					<table
						className="table table-hover view-pick-results-table"
						key="view-pick-results-table"
					>
						<thead className="thead-default">
							<tr>
								<th colSpan={2}>My Results</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>{`Week ${selectedWeek} score`}</td>
								<td>
									{tiebreaker.points_earned}/{maxPoints}
								</td>
							</tr>
							<tr>
								<td>Games picked correctly</td>
								<td>
									{tiebreaker.games_correct}/{games.length}
								</td>
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
				</>
			) : (
				<Loading />
			)}
		</div>
	);
};

ViewPicks.whyDidYouRender = true;

export default withTracker<TViewPicksProps, {}>(
	(): TViewPicksProps => {
		const selectedWeek = Session.get('selectedWeek');
		const currentLeague = DEFAULT_LEAGUE; //Session.get('selectedLeague'), //TODO: Eventually will need to uncomment this and allow them to change current league
		const picksHandle = Meteor.subscribe(
			'singleWeekPicksForUser',
			selectedWeek,
			currentLeague,
		);
		const picksReady = picksHandle.ready();
		const tiebreakersHandle = Meteor.subscribe(
			'singleTiebreakerForUser',
			selectedWeek,
			currentLeague,
		);
		const tiebreakersReady = tiebreakersHandle.ready();
		const gamesHandle = Meteor.subscribe('gamesForWeek', selectedWeek);
		const gamesReady = gamesHandle.ready();
		const teamsHandle = Meteor.subscribe('allTeams');
		const teamsReady = teamsHandle.ready();
		let games: TGame[] = [];
		let picks: TPick[] = [];
		let tiebreaker: TTiebreaker = {} as any;

		if (gamesReady) games = getGamesForWeekSync({ week: selectedWeek });

		if (picksReady)
			picks = getPicksForWeekSync({
				league: currentLeague,
				week: selectedWeek,
			});

		if (tiebreakersReady)
			tiebreaker = getTiebreakerSync({
				league: currentLeague,
				week: selectedWeek,
			});

		return {
			games,
			pageReady: gamesReady && picksReady && teamsReady && tiebreakersReady,
			picks,
			selectedWeek,
			tiebreaker,
		};
	},
)(ViewPicks);
