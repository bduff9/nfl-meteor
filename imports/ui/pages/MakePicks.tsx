import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { isAfter } from 'date-fns';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import { Bert } from 'meteor/themeteorchef:bert';
import React, {
	FC,
	useState,
	useEffect,
	MouseEvent,
	FormEvent,
	useRef,
} from 'react';
import Helmet from 'react-helmet';
import { withRouter, RouteComponentProps } from 'react-router';
import sweetAlert from 'sweetalert';

import { getGamesForWeek, TGame } from '../../api/collections/games';
import {
	autoPick,
	getPicksForWeek,
	resetPicks,
	TPick,
} from '../../api/collections/picks';
import {
	getTiebreakerSync,
	resetTiebreaker,
	setTiebreaker,
	submitPicks,
	TTiebreaker,
} from '../../api/collections/tiebreakers';
import { TUser } from '../../api/collections/users';
import { TWeek, TAutoPickStrategy, TError } from '../../api/commonTypes';
import { DEFAULT_LEAGUE } from '../../api/constants';
import { arePointListsEqual, handleError } from '../../api/global';
import PointHolder from '../components/PointHolder';
import TeamHover from '../components/TeamHover';

import Loading from './Loading';

export type TPointArrays =
	| {
			available: number[];
			ready: true;
			unavailable: number[];
			used: number[];
	  }
	| {
			available: [];
			ready: false;
			unavailable: [];
			used: [];
	  };
const populatePoints = (games: TGame[], picks: TPick[]): TPointArrays => {
	if (picks.length === 0 || games.length === 0) {
		return {
			available: [],
			ready: false,
			unavailable: [],
			used: [],
		};
	}

	const used = picks
		.filter((pick): boolean => !!pick.points && !!pick.pick_id)
		.map((pick): number => pick.points || 0)
		.filter((point): boolean => point > 0);
	const unavailable = picks
		.filter(
			(pick, i): boolean =>
				!pick.pick_id && isAfter(new Date(), games[i].kickoff),
		)
		.map((pick): number => pick.points || 0)
		.filter((point): boolean => point > 0);
	const allUsed = used.concat(unavailable);
	const available = [];

	for (let i = 1; i <= games.length; i++) {
		if (allUsed.indexOf(i) === -1) available.push(i);
	}

	return { available, ready: true, unavailable, used };
};

export type TMakePicksProps = {
	currentLeague: string;
	currentWeek: TWeek;
	games: TGame[];
	pageReady: boolean;
	picks: TPick[];
	selectedWeek: TWeek;
	tiebreaker: TTiebreaker;
};

const MakePicks: FC<RouteComponentProps & TMakePicksProps> = ({
	currentLeague,
	currentWeek,
	games,
	history,
	pageReady,
	picks,
	selectedWeek,
	tiebreaker,
}): JSX.Element => {
	const [available, setAvailable] = useState<number[]>([]);
	const [pointsReady, setPointsReady] = useState<boolean>(false);
	const [unavailable, setUnavailable] = useState<number[]>([]);
	const [used, setUsed] = useState<number[]>([]);
	const [hoverGame, setHoverGame] = useState<TGame | null>(null);
	const [hoverIsHome, setHoverIsHome] = useState<boolean>(false);
	const [hoverTeam, setHoverTeam] = useState<string>('');
	const [hoverOn, setHoverOn] = useState<HTMLElement | null>(null);
	const tiebreakerEl = useRef<HTMLInputElement>(null);
	const lastGame = games[games.length - 1];
	const lastHomeTeam = lastGame && lastGame.getTeam('home');
	const lastVisitingTeam = lastGame && lastGame.getTeam('visitor');
	let lastGameStarted = false;

	useEffect((): void => {
		const notAllowed =
			pageReady && (selectedWeek < currentWeek || tiebreaker.submitted);

		if (notAllowed) history.push('/picks/view');

		if (pageReady) {
			const pointArrays = populatePoints(games, picks);

			if (!arePointListsEqual(available, pointArrays.available))
				setAvailable(pointArrays.available);

			if (!arePointListsEqual(unavailable, pointArrays.unavailable))
				setUnavailable(pointArrays.unavailable);

			if (!arePointListsEqual(used, pointArrays.used))
				setUsed(pointArrays.used);

			setPointsReady(pointArrays.ready);
		}
	}, [
		available,
		currentWeek,
		games,
		history,
		pageReady,
		picks,
		selectedWeek,
		tiebreaker.submitted,
		unavailable,
		used,
	]);

	const _autopick = (type: TAutoPickStrategy, ev: MouseEvent): false => {
		ev.preventDefault();
		autoPick.call(
			{ available, league: currentLeague, selectedWeek, type },
			handleError,
		);
		Bert.alert({
			icon: 'fas fa-check',
			message: `Your unset picks have been automatically set ${
				type === 'Random' ? 'randomly' : `to the ${type} teams`
			}!`,
			type: 'success',
		});

		return false;
	};

	const _handleSubmitPicks = (): void => {
		const user = Meteor.user() as TUser;

		setTimeout((): void => {
			submitPicks.call(
				{ league: currentLeague, week: selectedWeek },
				(err: TError): void => {
					if (err) {
						handleError(err);
					} else {
						Meteor.call(
							'Email.sendEmail',
							{
								data: {
									picks,
									preview:
										'This is an automated notification to let you know that we have successfully received your picks for this week',
									tiebreaker,
									user,
									week: selectedWeek,
								},
								subject: `Your week ${selectedWeek} picks have been submitted`,
								template: 'picksConfirm',
								to: user.email,
							},
							handleError,
						);
						sweetAlert({
							title: 'Good luck this week!',
							text:
								'Your picks have been submitted and can no longer be changed. You can now close this message to view/print your picks',
							icon: 'success',
						}).then((): void => history.push('/picks/view'));
					}
				},
			);
		}, 500);
	};

	const _setHover = (
		hoverTeam = '',
		hoverGame: TGame | null = null,
		hoverIsHome = false,
		ev: MouseEvent<HTMLSpanElement>,
	): void => {
		setHoverGame(hoverGame);
		setHoverIsHome(hoverIsHome);
		setHoverTeam(hoverTeam);
		setHoverOn(hoverTeam ? ev.currentTarget : null);
	};

	const _setTiebreakerWrapper = (ev: FormEvent<HTMLInputElement>): void => {
		const lastScoreStr = ev.currentTarget.value;
		const lastScore = lastScoreStr ? parseInt(lastScoreStr, 10) : 0;

		setTiebreaker.call(
			{ lastScore, league: currentLeague, week: selectedWeek },
			handleError,
		);
	};

	const _resetPicks = (): void => {
		resetPicks.call({ league: currentLeague, selectedWeek }, handleError);
		resetTiebreaker.call(
			{ league: currentLeague, week: selectedWeek },
			handleError,
		);
		Bert.alert({
			icon: 'fas fa-check',
			message: 'Your picks have been reset!',
			type: 'success',
		});
	};

	const _savePicks = (ev: MouseEvent<HTMLButtonElement>): void => {
		ev.currentTarget.disabled = true;

		sweetAlert({
			title: 'Your picks have been successfully saved!',
			text:
				'Please be sure to submit them as soon as you are ready, as they have only been saved, not submitted',
			icon: 'success',
			closeOnClickOutside: true,
		});
	};

	const _submitPicks = (
		picksLeft: boolean,
		tiebreaker: number | null | undefined,
		ev: MouseEvent<HTMLButtonElement>,
	): false => {
		const tiebreakerVal = tiebreakerEl.current
			? tiebreakerEl.current.value
			: '0';

		ev.preventDefault();

		if (picksLeft) {
			sweetAlert({
				title: 'Hold On!',
				text: 'You must use all available points before you can submit',
				icon: 'warning',
			});
		} else if (tiebreaker == null && !tiebreakerVal) {
			sweetAlert({
				title: 'Slow down!',
				text:
					'You must fill in a tiebreaker score at the bottom of this page before you can submit',
				icon: 'warning',
			});
		} else {
			sweetAlert({
				title: 'Are you sure?',
				text:
					"Once you submit your picks, you will be allowed to see everyone else's and therefore will be unable to change them",
				icon: 'info',
				buttons: {
					cancel: {
						text: 'No, cancel',
						visible: true,
						closeModal: true,
					},
					confirm: {
						text: 'Yes, submit',
						value: true,
						visible: true,
						closeModal: false,
					},
				},
			}).then(
				(result: true | null): void => {
					if (result) _handleSubmitPicks();
				},
			);
		}

		return false;
	};

	return (
		<div className="row make-picks-wrapper">
			<Helmet title={`Set Week ${selectedWeek} Picks`} />
			{pageReady ? (
				<>
					<div className="col-12 row pr-0" key="picks">
						<h3 className="col-12 pr-0 title-text text-center text-md-left d-md-none">{`Set Week ${selectedWeek} Picks`}</h3>
						<div className="col-12 pr-1 mb-1">
							<PointHolder
								className="pointBank"
								disabledPoints={unavailable}
								league={currentLeague}
								numGames={games.length}
								points={available}
								pointsReady={pointsReady}
								selectedWeek={selectedWeek}
								key={`point-bank-has-${available.length}-available-and-${
									unavailable.length
								}-unavailable-points`}
							/>
						</div>
						<div className="col-12 pr-0 table-wrapper">
							<table className="table table-hover mx-auto makePickTable">
								<thead className="thead-default">
									<tr>
										<th>
											<div className="row">
												<div className="col-6 text-center">Away</div>
												<div className="col-6 text-center">Home</div>
											</div>
										</th>
									</tr>
								</thead>
								<tbody>
									{games.map(
										(game, i): JSX.Element => {
											const homeTeam = game.getTeam('home');
											const visitTeam = game.getTeam('visitor');
											const thisPick = picks[i];
											const homePicked = thisPick.pick_id === homeTeam._id;
											const visitorPicked = thisPick.pick_id === visitTeam._id;
											const started = game.kickoff <= new Date();

											lastGameStarted = started;

											return (
												<tr
													className={
														(homePicked || visitorPicked ? 'done' : '') +
														(started ? ' disabled' : '')
													}
													title={
														started
															? 'This game has already begun, no changes allowed'
															: undefined
													}
													key={`game-for-picks-${game._id}`}
												>
													<td>
														<div className="row">
															<div className="col-6 col-md-2 visitorPoints">
																{(visitorPicked || !started) && (
																	<PointHolder
																		className="pull-md-right"
																		disabledPoints={
																			visitorPicked &&
																			started &&
																			thisPick.points
																				? [thisPick.points]
																				: []
																		}
																		gameId={game._id}
																		league={currentLeague}
																		numGames={games.length}
																		points={
																			visitorPicked &&
																			!started &&
																			thisPick.points
																				? [thisPick.points]
																				: []
																		}
																		pointsReady={pointsReady}
																		selectedWeek={selectedWeek}
																		teamId={visitTeam._id}
																		teamShort={visitTeam.short_name}
																		key={`${
																			visitorPicked && thisPick.points ? 1 : 0
																		}-points-for-visitor-in-${game._id}`}
																	/>
																)}
															</div>
															<div className="col-6 col-md-2 text-center text-md-right visitorLogo">
																<img src={`/NFLLogos/${visitTeam.logo}`} />
															</div>
															<div className="col-6 col-md-2 text-center text-md-right visitorName">
																<span
																	onMouseEnter={(ev): void =>
																		_setHover(visitTeam._id, game, false, ev)
																	}
																	onMouseLeave={(ev): void =>
																		_setHover(
																			undefined,
																			undefined,
																			undefined,
																			ev,
																		)
																	}
																>
																	<FontAwesomeIcon
																		className="text-primary d-none d-md-inline team-hover-link"
																		icon={['fad', 'info-circle']}
																		fixedWidth
																	/>
																</span>
																&nbsp;{visitTeam.city}
																<br />
																{visitTeam.name}
															</div>
															<div className="col-6 col-md-2 text-center text-md-left homeName">
																{homeTeam.city}&nbsp;
																<span
																	onMouseEnter={(ev): void =>
																		_setHover(homeTeam._id, game, true, ev)
																	}
																	onMouseLeave={(ev): void =>
																		_setHover(
																			undefined,
																			undefined,
																			undefined,
																			ev,
																		)
																	}
																>
																	<FontAwesomeIcon
																		className="text-primary d-none d-sm-inline team-hover-link"
																		icon={['fad', 'info-circle']}
																		fixedWidth
																	/>
																</span>
																<br />
																{homeTeam.name}
															</div>
															<div className="col-6 col-md-2 text-center text-md-left homeLogo">
																<img src={`/NFLLogos/${homeTeam.logo}`} />
															</div>
															<div className="col-6 col-md-2 homePoints">
																{(homePicked || !started) && (
																	<PointHolder
																		className="pull-md-left"
																		disabledPoints={
																			homePicked && started && thisPick.points
																				? [thisPick.points]
																				: []
																		}
																		gameId={game._id}
																		league={currentLeague}
																		numGames={games.length}
																		points={
																			homePicked && !started && thisPick.points
																				? [thisPick.points]
																				: []
																		}
																		pointsReady={pointsReady}
																		selectedWeek={selectedWeek}
																		teamId={homeTeam._id}
																		teamShort={homeTeam.short_name}
																		key={`${
																			homePicked && thisPick.points ? 1 : 0
																		}-points-for-home-in-${game._id}`}
																	/>
																)}
															</div>
														</div>
													</td>
												</tr>
											);
										},
									)}
								</tbody>
							</table>
							{lastVisitingTeam && lastHomeTeam && (
								<table className="table table-hover mx-auto tiebreakerTable">
									<thead className="thead-default">
										<tr>
											<th>Tiebreaker</th>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>{`Without going over, input the total number of points scored in the ${
												lastVisitingTeam.city
											} ${lastVisitingTeam.name} vs. ${lastHomeTeam.city} ${
												lastHomeTeam.name
											} game`}</td>
										</tr>
										<tr>
											<td>
												<input
													className="form-control"
													defaultValue={`${tiebreaker.last_score || 0}`}
													disabled={lastGameStarted}
													onBlur={!lastGameStarted && _setTiebreakerWrapper}
													ref={tiebreakerEl}
													type="number"
												/>
											</td>
										</tr>
									</tbody>
								</table>
							)}
						</div>
					</div>
					<div
						className="col-12 col-sm-9 col-md-10 text-center pick-buttons"
						key="pick-buttons"
					>
						<button
							type="button"
							className="btn btn-danger"
							disabled={used.length === 0}
							onClick={_resetPicks}
						>
							<FontAwesomeIcon
								className="d-none d-md-inline"
								icon={['fad', 'sync']}
								fixedWidth
							/>{' '}
							Reset
						</button>
						<div className="btn-group dropup">
							<button
								type="button"
								className="btn btn-warning dropdown-toggle"
								data-toggle="dropdown"
								aria-haspopup="true"
								aria-expanded="false"
								disabled={available.length === 0}
							>
								<FontAwesomeIcon
									className="d-none d-md-inline"
									icon={['fad', 'magic']}
									fixedWidth
								/>{' '}
								Auto-Pick
							</button>
							<div className="dropdown-menu">
								<a
									className="dropdown-item"
									href="#"
									onClick={(ev): false => _autopick('Away', ev)}
								>
									All Away Teams
								</a>
								<a
									className="dropdown-item"
									href="#"
									onClick={(ev): false => _autopick('Home', ev)}
								>
									All Home Teams
								</a>
								<div className="dropdown-divider" />
								<a
									className="dropdown-item"
									href="#"
									onClick={(ev): false => _autopick('Random', ev)}
								>
									Random
								</a>
							</div>
						</div>
						<button
							type="button"
							className="btn btn-primary"
							disabled={used.length === 0}
							onClick={_savePicks}
						>
							<FontAwesomeIcon
								className="d-none d-md-inline"
								icon={['fad', 'save']}
								fixedWidth
							/>{' '}
							Save
						</button>
						<button
							type="submit"
							className="btn btn-success"
							onClick={(ev): false =>
								_submitPicks(available.length !== 0, tiebreaker.last_score, ev)
							}
						>
							<FontAwesomeIcon
								className="d-none d-md-inline"
								icon={['fad', 'arrow-circle-right']}
								fixedWidth
							/>{' '}
							Submit
						</button>
					</div>
				</>
			) : (
				<Loading />
			)}
			{hoverTeam && hoverGame && (
				<TeamHover
					game={hoverGame}
					isHome={hoverIsHome}
					target={hoverOn}
					teamId={hoverTeam}
				/>
			)}
		</div>
	);
};

MakePicks.whyDidYouRender = true;

export default withTracker<TMakePicksProps, {}>(
	(): TMakePicksProps => {
		const currentWeek = Session.get('currentWeek');
		const selectedWeek = Session.get('selectedWeek');
		const currentLeague = DEFAULT_LEAGUE; //Session.get('selectedLeague'), //TODO: Eventually will need to uncomment this and allow them to change current league
		const picksHandle = Meteor.subscribe(
			'singleWeekPicksForUser',
			selectedWeek,
			currentLeague,
		);
		const picksReady = picksHandle.ready();
		const tiebreakerHandle = Meteor.subscribe(
			'singleTiebreakerForUser',
			selectedWeek,
			currentLeague,
		);
		const tiebreakerReady = tiebreakerHandle.ready();
		const gamesHandle = Meteor.subscribe('gamesForWeek', selectedWeek);
		const gamesReady = gamesHandle.ready();
		const teamsHandle = Meteor.subscribe('allTeams');
		const teamsReady = teamsHandle.ready();
		let games: TGame[] = [];
		let picks: TPick[] = [];
		let tiebreaker: TTiebreaker = {} as any;

		if (gamesReady) games = getGamesForWeek.call({ week: selectedWeek });

		if (picksReady)
			picks = getPicksForWeek.call({
				league: currentLeague,
				week: selectedWeek,
			});

		if (tiebreakerReady)
			tiebreaker = getTiebreakerSync({
				league: currentLeague,
				week: selectedWeek,
			});

		return {
			currentLeague,
			currentWeek,
			games,
			pageReady: gamesReady && picksReady && teamsReady && tiebreakerReady,
			picks,
			selectedWeek,
			tiebreaker,
		};
	},
)(withRouter(MakePicks));
