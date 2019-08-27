import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import React, { FC, useState, useEffect, Fragment } from 'react';
import Helmet from 'react-helmet';
import { RouteComponentProps, withRouter } from 'react-router';

import '../../ui/pages/ViewAllPicksPrint.scss';

import { getGamesForWeek, TGame } from '../../api/collections/games';
import { getAllPicksForWeek, TPick } from '../../api/collections/picks';
import {
	getTiebreaker,
	getAllTiebreakersForWeek,
	TTiebreaker,
} from '../../api/collections/tiebreakers';
import { getCurrentUser, TUser } from '../../api/collections/users';
import { TWeek } from '../../api/commonTypes';
import { DEFAULT_LEAGUE } from '../../api/constants';
import { weekPlacer } from '../../api/global';

import Loading from './Loading';

export type TViewAllPicksProps = {
	currentUser: TUser;
	currentWeek: TWeek;
	pageReady: boolean;
	picks: TPick[];
	selectedWeek: TWeek;
	tiebreaker: TTiebreaker;
	tiebreakers: TTiebreaker[];
	weekGames: TGame[];
};
export type TUpdateUsers = {
	games: TGame[];
	picks: TPick[];
	selectedWeek: TWeek;
	tiebreakers: TTiebreaker[];
};
export type TNewTiebreaker = TTiebreaker & {
	full_name?: string;
};

const _updateUsers = ({
	games,
	picks,
	selectedWeek,
	tiebreakers,
}: TUpdateUsers): TNewTiebreaker[] => {
	const newTiebreakers = tiebreakers.map(
		(tiebreaker): TNewTiebreaker => {
			const newTiebreaker: TNewTiebreaker = Object.assign({}, tiebreaker);
			const userPicks = picks.filter(
				pick => pick.user_id === newTiebreaker.user_id,
			);
			let pts = 0;
			let gms = 0;
			let game;

			// eslint-disable-next-line @typescript-eslint/camelcase
			newTiebreaker.full_name = tiebreaker.getFullName();

			userPicks.forEach(
				(pick, i): void => {
					game = games[i];

					if (game.winner_id && pick.pick_id === game.winner_id) {
						pts += pick.points || 0;
						gms += 1;
					}
				},
			);

			if (newTiebreaker) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				newTiebreaker.points_earned = pts;
				// eslint-disable-next-line @typescript-eslint/camelcase
				newTiebreaker.games_correct = gms;
			}

			return newTiebreaker;
		},
	);

	newTiebreakers.sort(weekPlacer);

	newTiebreakers.forEach(
		(tiebreaker, i, allTiebreakers): void => {
			let currPlace = i + 1;
			let result;

			if (!tiebreaker.tied_flag || i === 0) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				tiebreaker.place_in_week = currPlace;
			} else {
				currPlace = tiebreaker.place_in_week || 0;
			}

			const nextTiebreaker = allTiebreakers[i + 1];

			if (nextTiebreaker) {
				result = weekPlacer(tiebreaker, nextTiebreaker);

				if (result === 0) {
					// eslint-disable-next-line @typescript-eslint/camelcase
					tiebreaker.tied_flag = true;
					// eslint-disable-next-line @typescript-eslint/camelcase
					nextTiebreaker.place_in_week = currPlace;
					// eslint-disable-next-line @typescript-eslint/camelcase
					nextTiebreaker.tied_flag = true;
				} else {
					// eslint-disable-next-line @typescript-eslint/camelcase
					if (i === 0) tiebreaker.tied_flag = false;

					// eslint-disable-next-line @typescript-eslint/camelcase
					nextTiebreaker.tied_flag = false;
				}
			}
		},
	);

	return newTiebreakers;
};

const ViewAllPicks: FC<RouteComponentProps & TViewAllPicksProps> = ({
	currentUser,
	currentWeek,
	history,
	pageReady,
	picks,
	selectedWeek,
	tiebreaker,
	tiebreakers,
	weekGames,
}): JSX.Element => {
	const [games, setGames] = useState<TGame[]>([]);
	const [users, setUsers] = useState<TNewTiebreaker[]>([]);

	useEffect((): void => {
		const notAllowed =
			pageReady && selectedWeek >= currentWeek && !tiebreaker.submitted;

		if (notAllowed) history.push('/picks/set');

		if (pageReady) {
			setGames(weekGames.map(game => Object.assign({}, game)));
			setUsers(
				_updateUsers({ games: weekGames, picks, selectedWeek, tiebreakers }),
			);
		}
	}, [
		currentWeek,
		history,
		pageReady,
		picks,
		selectedWeek,
		tiebreaker.submitted,
		tiebreakers,
		weekGames,
	]);

	const _resetPicks = (): void => {
		setGames(weekGames.map(game => Object.assign({}, game)));
		setUsers(
			_updateUsers({ games: weekGames, picks, selectedWeek, tiebreakers }),
		);
	};

	const _updateGame = (teamId: string, teamShort: string, i: number): void => {
		// eslint-disable-next-line @typescript-eslint/camelcase
		games[i].winner_id = teamId;
		// eslint-disable-next-line @typescript-eslint/camelcase
		games[i].winner_short = teamShort;

		setGames(games);
		setUsers(_updateUsers({ games, picks, selectedWeek, tiebreakers }));
	};

	return (
		<div className="row view-all-picks-wrapper">
			<Helmet title={`View All Week ${selectedWeek} Picks`} />
			<h3 className="title-text text-center col-12 d-md-none">{`View All Week ${selectedWeek} Picks`}</h3>
			{pageReady ? (
				<div className="col-12 text-left view-all-picks">
					<button
						type="button"
						className="btn btn-danger reset-picks d-print-none"
						onClick={_resetPicks}
					>
						<FontAwesomeIcon icon={['fad', 'sync']} fixedWidth />
						Reset Page
					</button>
					<button
						type="button"
						className="btn btn-primary d-none d-md-inline-block d-print-none print-page"
						onClick={window.print}
					>
						<FontAwesomeIcon icon={['fad', 'print']} fixedWidth />
						Print this Page
					</button>
					<table className="table table-hover view-all-picks-table">
						<thead>
							<tr className="d-print-none">
								<th colSpan={5 + games.length * 6}>
									Click the team names below to test &quot;what-if&quot;
									scenarios. To undo, click &apos;Reset Page&apos; above.
								</th>
							</tr>
							<tr>
								<th className="info-head">Name</th>
								{games.map(
									(game, i): JSX.Element => (
										<Fragment key={`game-${game._id}`}>
											<th className="visiting-team" colSpan={2}>
												<button
													className={
														'btn' +
														(game.visitor_id === game.winner_id
															? ' btn-success'
															: game.winner_id
																? ' btn-danger'
																: ' btn-secondary')
													}
													onClick={(): void =>
														_updateGame(game.visitor_id, game.visitor_short, i)
													}
												>
													{game.visitor_short}
												</button>
												<div
													className={
														'show-for-print' +
														(game.visitor_id === game.winner_id
															? ' text-success'
															: game.winner_id
																? ' text-danger'
																: '')
													}
												>
													{game.visitor_short}
												</div>
											</th>
											<th className="team-separator" colSpan={2}>
												@
											</th>
											<th className="home-team" colSpan={2}>
												<button
													className={
														'btn' +
														(game.home_id === game.winner_id
															? ' btn-success'
															: game.winner_id
																? ' btn-danger'
																: ' btn-secondary')
													}
													onClick={(): void =>
														_updateGame(game.home_id, game.home_short, i)
													}
												>
													{game.home_short}
												</button>
												<div
													className={
														'show-for-print' +
														(game.home_id === game.winner_id
															? ' text-success'
															: game.winner_id
																? ' text-danger'
																: '')
													}
												>
													{game.home_short}
												</div>
											</th>
										</Fragment>
									),
								)}
								<th className="info-head">Points Earned</th>
								<th className="info-head">Games Correct</th>
								<th className="info-head">My Tiebreaker Score</th>
								<th className="info-head">Last Game Score</th>
							</tr>
						</thead>
						<tbody>
							{users.map(
								(tiebreaker): JSX.Element => (
									<tr
										className={
											tiebreaker.user_id === currentUser._id
												? 'my-user'
												: undefined
										}
										key={`user-${tiebreaker.user_id}`}
									>
										<td className="name-cell">{`${
											tiebreaker.tied_flag ? 'T' : ''
										}${tiebreaker.place_in_week}. ${tiebreaker.full_name}`}</td>
										{picks
											.filter(
												(pick): boolean => pick.user_id === tiebreaker.user_id,
											)
											.map(
												(pick, i): JSX.Element => {
													const game = games[i];

													return (
														<Fragment key={`pick-${pick._id}`}>
															<td
																className={
																	'text-center visiting-team pick-points' +
																	(game.winner_id
																		? pick.pick_id === game.winner_id
																			? ' text-success'
																			: ' text-danger'
																		: '')
																}
																colSpan={3}
															>
																{pick.pick_id &&
																	pick.pick_id === game.visitor_id &&
																	pick.points}
															</td>
															<td
																className={
																	'text-center home-team pick-points' +
																	(game.winner_id
																		? pick.pick_id === game.winner_id
																			? ' text-success'
																			: ' text-danger'
																		: '')
																}
																colSpan={3}
																key={'userhomepick' + pick._id}
															>
																{pick.pick_id &&
																	pick.pick_id === game.home_id &&
																	pick.points}
															</td>
														</Fragment>
													);
												},
											)}
										<td className="text-center pick-points">
											{tiebreaker.points_earned}
										</td>
										<td className="text-center pick-points">
											{tiebreaker.games_correct}
										</td>
										<td className="text-center pick-points">
											{tiebreaker.last_score}
										</td>
										<td className="text-center pick-points">
											{tiebreaker.last_score_act}
										</td>
									</tr>
								),
							)}
						</tbody>
					</table>
				</div>
			) : (
				<Loading />
			)}
		</div>
	);
};

ViewAllPicks.whyDidYouRender = true;

export default withTracker<TViewAllPicksProps, {}>(
	(): TViewAllPicksProps => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		const currentUser: TUser = getCurrentUser.call({});
		const currentWeek = Session.get('currentWeek');
		const selectedWeek = Session.get('selectedWeek');
		const currentLeague = DEFAULT_LEAGUE; //Session.get('selectedLeague'), //TODO: Eventually will need to uncomment this and allow them to change current league
		const tiebreakerHandle = Meteor.subscribe(
			'singleTiebreakerForUser',
			selectedWeek,
			currentLeague,
		);
		const tiebreakerReady = tiebreakerHandle.ready();
		const picksHandle = Meteor.subscribe(
			'allPicksForWeek',
			selectedWeek,
			currentLeague,
		);
		const picksReady = picksHandle.ready();
		const tiebreakersHandle = Meteor.subscribe(
			'allTiebreakersForWeek',
			selectedWeek,
			currentLeague,
		);
		const tiebreakersReady = tiebreakersHandle.ready();
		const gamesHandle = Meteor.subscribe('gamesForWeek', selectedWeek);
		const gamesReady = gamesHandle.ready();
		const teamsHandle = Meteor.subscribe('allTeams');
		const teamsReady = teamsHandle.ready();
		const usersHandle = Meteor.subscribe('basicUsersInfo');
		const usersReady = usersHandle.ready();
		let tiebreaker: TTiebreaker = {} as any;
		let tiebreakers: TTiebreaker[] = [];
		let picks: TPick[] = [];
		let weekGames: TGame[] = [];

		if (tiebreakerReady)
			tiebreaker = getTiebreaker.call({
				league: currentLeague,
				week: selectedWeek,
			});

		if (gamesReady) weekGames = getGamesForWeek.call({ week: selectedWeek });

		if (picksReady)
			picks = getAllPicksForWeek.call({
				league: currentLeague,
				week: selectedWeek,
			});

		if (tiebreakersReady)
			tiebreakers = getAllTiebreakersForWeek.call({
				league: currentLeague,
				week: selectedWeek,
			});

		return {
			currentUser,
			currentWeek,
			pageReady:
				gamesReady &&
				picksReady &&
				teamsReady &&
				tiebreakerReady &&
				tiebreakersReady &&
				usersReady,
			picks,
			selectedWeek,
			tiebreaker,
			tiebreakers,
			weekGames,
		};
	},
)(withRouter(ViewAllPicks));
