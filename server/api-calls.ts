import { isAfter } from 'date-fns';
import { HTTP } from 'meteor/http';
import { Meteor } from 'meteor/meteor';

import {
	assignPointsToMissed,
	getPicksForWeek,
	Picks,
	TPick,
} from '../imports/api/collections/picks';
import { SurvivorPicks } from '../imports/api/collections/survivorpicks';
import {
	getSystemValues,
	toggleGamesUpdating,
	TSystemVals,
} from '../imports/api/collections/systemvals';
import {
	getTeamByShort,
	getTeamByShortSync,
	TTeam,
} from '../imports/api/collections/teams';
import {
	getAdmins,
	getAllLeagues,
	getUsers,
	TUser,
	updatePlaces,
	updatePoints,
	updateSurvivor,
} from '../imports/api/collections/users';
import {
	TWeek,
	TGameNumber,
	TGameStatus,
	TError,
	TAdminMessage,
} from '../imports/api/commonTypes';
import {
	convertDateToEpoch,
	convertEpoch,
	handleError,
} from '../imports/api/global';
import {
	currentWeek,
	findGame,
	getFirstGameOfWeek,
	getWeeksToRefresh,
	getGamesForWeek as getDBGamesForWeek,
	insertGame,
	TGame,
	findFutureGame,
} from '../imports/api/collections/games';
import { WEEKS_IN_SEASON } from '../imports/api/constants';

import { insertAPICall } from './collections/apicalls';
import { endOfWeekMessage } from './collections/nfllogs';
import { updateLastGameOfWeekScore } from './collections/tiebreakers';
import { sendEmail } from './emails/email';
import { updateKickoff, redoGameNumbers } from './collections/games';
import {
	fixUsersPicks,
	fixTooHighPoints,
	fixTooLowPoints,
} from './collections/picks';

export type TAPIBoolean = '0' | '1';
export type TAPITeam = {
	hasPossession: string;
	id: string;
	inRedZone: string;
	isHome: string;
	passDefenseRank: string;
	passOffenseRank: string;
	rushDefenseRank: string;
	rushOffenseRank: string;
	score: string;
	spread: string;
};
export type TAPIMatchup = {
	gameSecondsRemaining: string;
	kickoff: string;
	team: TAPITeam[];
};
export interface TAPINflSchedule {
	matchup?: TAPIMatchup[];
	week: string;
}
export interface TAPIResponse {
	encoding: string;
	nflSchedule: TAPINflSchedule;
	version: string;
}
export interface TAPIFullResponse {
	encoding: string;
	fullNflSchedule: { nflSchedule: TAPINflSchedule[] };
	version: string;
}

const getEntireSeason = (): TAPINflSchedule[] => {
	const systemVals = (getSystemValues.call({}) as unknown) as TSystemVals;
	const currYear = systemVals.year_updated;
	let url;

	if (Meteor.settings.mode === 'production' || !Meteor.settings.apiHost) {
		url = `https://api.myfantasyleague.com/fflnetdynamic${currYear}/nfl_sched.json`;
	} else {
		url = `${
			Meteor.settings.apiHost
		}/${currYear}/export?TYPE=nflSchedule&JSON=1`;
	}

	try {
		const response = HTTP.get(url, {
			headers: {
				'User-Agent': 'ASWNN-NFL',
			},
		});
		const apiResponse = response.data as TAPIFullResponse;

		insertAPICall.call({ response: apiResponse, url, year: currYear });

		return apiResponse.fullNflSchedule.nflSchedule;
	} catch (error) {
		insertAPICall.call({ error, response: null, url, year: currYear });

		return [];
	}
};

export const getGamesForWeek = (week: TWeek): TAPIMatchup[] => {
	const systemVals = (getSystemValues.call({}) as unknown) as TSystemVals;
	const currYear = systemVals.year_updated;
	let url;

	if (Meteor.settings.mode === 'production' || !Meteor.settings.apiHost) {
		url = `https://api.myfantasyleague.com/fflnetdynamic${currYear}/nfl_sched_${week}.json`;
	} else {
		url = `${
			Meteor.settings.apiHost
		}/${currYear}/export?TYPE=nflSchedule&W=${week}&JSON=1`;
	}

	try {
		const response = HTTP.get(url, {
			headers: {
				'User-Agent': 'ASWNN-NFL',
			},
		});
		const apiResponse = response.data as TAPIResponse;

		insertAPICall.call({ response: apiResponse, url, week, year: currYear });

		return apiResponse.nflSchedule.matchup || [];
	} catch (error) {
		insertAPICall.call({ error, response: null, url, week, year: currYear });

		return [];
	}
};

const getHomeTeamFromAPI = (apiGame: TAPIMatchup): TAPITeam | undefined =>
	apiGame.team.find((team): boolean => team.isHome === '1');

const getVisitorTeamFromAPI = (apiGame: TAPIMatchup): TAPITeam | undefined =>
	apiGame.team.find((team): boolean => team.isHome === '0');

const populateGamesForWeek = ({
	matchup: games,
	week,
}: TAPINflSchedule): void => {
	const w = parseInt(week, 10);
	let game: TGame;
	let hTeam;
	let vTeam;

	if (!games) {
		throw new Error(`No games found for week ${week}`);
	}

	console.log('Week ' + w + ': ' + games.length + ' games');

	games.forEach(
		(gameObj, i): void => {
			const hTeamData = getHomeTeamFromAPI(gameObj);
			const vTeamData = getVisitorTeamFromAPI(gameObj);

			if (!hTeamData || !vTeamData)
				throw new Meteor.Error(
					'Missing data',
					`Home team is ${hTeamData}, visitor is ${vTeamData}`,
				);

			// eslint-disable-next-line @typescript-eslint/camelcase
			hTeam = getTeamByShortSync({ short_name: hTeamData.id });
			// eslint-disable-next-line @typescript-eslint/camelcase
			vTeam = getTeamByShortSync({ short_name: vTeamData.id });

			// Create and save this game
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			game = {
				week: (w as unknown) as TWeek,
				game: (i + 1) as TGameNumber,
				// eslint-disable-next-line @typescript-eslint/camelcase
				home_id: hTeam._id,
				// eslint-disable-next-line @typescript-eslint/camelcase
				home_short: hTeam.short_name,
				// eslint-disable-next-line @typescript-eslint/camelcase
				home_score: 0,
				// eslint-disable-next-line @typescript-eslint/camelcase
				visitor_id: vTeam._id,
				// eslint-disable-next-line @typescript-eslint/camelcase
				visitor_short: vTeam.short_name,
				// eslint-disable-next-line @typescript-eslint/camelcase
				visitor_score: 0,
				status: 'P',
				kickoff: convertEpoch(parseInt(gameObj.kickoff, 10)),
				// eslint-disable-next-line @typescript-eslint/camelcase
				time_left: parseInt(gameObj.gameSecondsRemaining || '0', 10),
			};

			insertGame.call({ game }, handleError);

			// Update home team data
			if (hTeamData.passDefenseRank) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				hTeam.pass_defense = parseInt(hTeamData.passDefenseRank, 10);
			}

			if (hTeamData.passOffenseRank) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				hTeam.pass_offense = parseInt(hTeamData.passOffenseRank, 10);
			}

			if (hTeamData.rushDefenseRank) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				hTeam.rush_defense = parseInt(hTeamData.rushDefenseRank, 10);
			}

			if (hTeamData.rushOffenseRank) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				hTeam.rush_offense = parseInt(hTeamData.rushOffenseRank, 10);
			}

			// eslint-disable-next-line @typescript-eslint/camelcase
			if (!hTeam.bye_week || hTeam.bye_week === w) hTeam.bye_week = w + 1;

			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			hTeam.save();

			// Update visiting team data
			if (vTeamData.passDefenseRank) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				vTeam.pass_defense = parseInt(vTeamData.passDefenseRank, 10);
			}

			if (vTeamData.passOffenseRank) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				vTeam.pass_offense = parseInt(vTeamData.passOffenseRank, 10);
			}

			if (vTeamData.rushDefenseRank) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				vTeam.rush_defense = parseInt(vTeamData.rushDefenseRank, 10);
			}

			if (vTeamData.rushOffenseRank) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				vTeam.rush_offense = parseInt(vTeamData.rushOffenseRank, 10);
			}

			// eslint-disable-next-line @typescript-eslint/camelcase
			if (!vTeam.bye_week || vTeam.bye_week === w) vTeam.bye_week = w + 1;

			vTeam.save();
		},
	);
};

export const populateGames = (): void => {
	const weeks = getEntireSeason();

	for (const week of weeks) {
		if (week.matchup) {
			populateGamesForWeek(week);
		}
	}
};

const sendAdminEmail = (
	invalidAPIGames: TAPIMatchup[],
	invalidDBGames: TGame[],
): void => {
	const admins = (getAdmins.call({}) as unknown) as TUser[];
	const emails = admins.map(({ email }): string => email);
	const messages: TAdminMessage[] = [];
	let week: null | TWeek = null;

	invalidAPIGames.forEach(
		(game): void => {
			const home = getHomeTeamFromAPI(game);
			const visitor = getVisitorTeamFromAPI(game);
			const message: TAdminMessage = {
				game: `${visitor} @ ${home} starting at ${game.kickoff}`,
				reason: 'Game is found in API but not in database',
			};

			messages.push(message);
		},
	);

	invalidDBGames.forEach(
		(game): void => {
			if (!week) week = game.week;

			const message: TAdminMessage = {
				game: `${game.visitor_short} @ ${game.home_short} starting at ${
					game.kickoff
				}`,
				reason: 'Game is found in database but not in API',
			};

			messages.push(message);
		},
	);

	sendEmail.call(
		{
			data: {
				messages,
				week,
			},
			subject: `Issue with week ${week} games found`,
			template: 'adminNotice',
			bcc: emails,
		},
		(err: TError): void => {
			if (err) {
				handleError(err);
			} else {
				console.log(`Sent admin emails on invalid games found in week ${week}`);
			}
		},
	);
};

const healPicks = (week: TWeek): void => {
	const games = (getDBGamesForWeek.call({ week }) as unknown) as TGame[];
	const gameIDs = games.map(({ _id }): string => _id);
	const minPoint = 1;
	const maxPoint = games.length;
	const users = (getUsers.call({ activeOnly: true }) as unknown) as TUser[];

	for (const user of users) {
		const leagues = user.leagues;

		for (const league of leagues) {
			let picks = (getPicksForWeek.call({
				league,
				// eslint-disable-next-line @typescript-eslint/camelcase
				user_id: user._id,
				week,
			}) as unknown) as TPick[];

			if (picks.length !== games.length) {
				picks = (fixUsersPicks.call({
					league,
					// eslint-disable-next-line @typescript-eslint/camelcase
					user_id: user._id,
					week,
				}) as unknown) as TPick[];
			} else {
				const foundPicks = picks.filter(
					(pick): boolean => gameIDs.includes(pick.game_id),
				);

				if (foundPicks.length !== picks.length) {
					picks = (fixUsersPicks.call({
						league,
						// eslint-disable-next-line @typescript-eslint/camelcase
						user_id: user._id,
						week,
					}) as unknown) as TPick[];
				}
			}

			const [tooLow, , tooHigh] = picks.reduce(
				(acc, { points }): [number, number, number] => {
					if (points === null || points === undefined) {
						acc[1]++;
					} else if (points < minPoint) {
						acc[0]++;
					} else if (points > maxPoint) {
						acc[2]++;
					} else {
						acc[1]++;
					}

					return acc;
				},
				[0, 0, 0],
			);

			if (tooHigh > 0) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				fixTooHighPoints.call({ league, user_id: user._id, week });
			}

			if (tooLow > 0) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				fixTooLowPoints.call({ league, user_id: user._id, week });
			}
		}
	}
};

const updateGameMeta = (game: TGame, week: TWeek, kickoff: number): void => {
	const oldWeek = game.week;

	updateKickoff.call({ gameID: game._id, week, kickoff });
	redoGameNumbers.call({ week });
	redoGameNumbers.call({ week: oldWeek });
};

const findAPIGame = (
	allAPIWeeks: TAPINflSchedule[],
	gameToFind: TGame,
): [TWeek, null | TAPIMatchup] => {
	for (let i = 0; i < allAPIWeeks.length; i++) {
		const apiWeek = allAPIWeeks[i];
		const week = parseInt(apiWeek.week, 10) as TWeek;

		if (!apiWeek.matchup) continue;

		const found = apiWeek.matchup.find(
			(game): boolean => {
				return game.team.every(
					(team): boolean =>
						(team.isHome === '1' && team.id === gameToFind.home_short) ||
						(team.isHome === '0' && team.id === gameToFind.visitor_short),
				);
			},
		);

		if (found) return [week, found];
	}

	return [17, null];
};

const healWeek = (week: TWeek, allAPIWeeks: TAPINflSchedule[]): void => {
	console.log(`Healing week ${week}...`);

	const currentAPIWeek = allAPIWeeks.find(
		({ week: w }): boolean => parseInt(w, 10) === week,
	);
	const currentDBWeek = (getDBGamesForWeek.call({
		week,
	}) as unknown) as TGame[];
	const validDBGames: TGame[] = [];
	const invalidDBGames: TGame[] = [];
	const validAPIGames: TAPIMatchup[] = [];
	const invalidAPIGames: TAPIMatchup[] = [];

	if (!currentAPIWeek || !currentAPIWeek.matchup) return;

	const apiGames = currentAPIWeek.matchup;

	for (let i = apiGames.length; i--; ) {
		const game = apiGames[i];
		const homeTeam = getHomeTeamFromAPI(game);
		const visitingTeam = getVisitorTeamFromAPI(game);
		const kickoffEpoch = parseInt(game.kickoff, 10);

		if (!homeTeam || !visitingTeam) {
			throw new Meteor.Error(
				'Missing data',
				`Home team is ${homeTeam}, visitor is ${visitingTeam}`,
			);
		}

		const gameIndex = currentDBWeek.findIndex(
			// eslint-disable-next-line @typescript-eslint/camelcase
			({ home_short, visitor_short }): boolean =>
				// eslint-disable-next-line @typescript-eslint/camelcase
				home_short === homeTeam.id && visitor_short === visitingTeam.id,
		);

		if (gameIndex > -1) {
			const dbGame = currentDBWeek[gameIndex];

			if (kickoffEpoch !== convertDateToEpoch(dbGame.kickoff)) {
				updateGameMeta(dbGame, week, kickoffEpoch);
			}

			validAPIGames.push(game);
			apiGames.splice(i, 1);
			validDBGames.push(dbGame);
			currentDBWeek.splice(gameIndex, 1);
		} else {
			try {
				const futureGame = (findFutureGame.call({
					// eslint-disable-next-line @typescript-eslint/camelcase
					home_short: homeTeam.id,
					// eslint-disable-next-line @typescript-eslint/camelcase
					visitor_short: visitingTeam.id,
					week,
				}) as unknown) as TGame;
				const futureWeek = futureGame.week;

				updateGameMeta(futureGame, week, kickoffEpoch);
				healPicks(futureWeek);
				healPicks(week);
			} catch (error) {
				invalidAPIGames.push(game);
				apiGames.splice(i, 1);
			}
		}
	}

	for (let i = currentDBWeek.length; i--; ) {
		const game = currentDBWeek[i];
		const [foundWeek, foundAPIGame] = findAPIGame(allAPIWeeks, game);

		if (foundAPIGame) {
			updateGameMeta(game, foundWeek, parseInt(foundAPIGame.kickoff, 10));
			healPicks(week);
			healPicks(foundWeek);
		} else {
			invalidDBGames.push(game);
		}

		currentDBWeek.splice(i, 1);
	}

	if (invalidAPIGames.length > 0 || invalidDBGames.length > 0) {
		sendAdminEmail(invalidAPIGames, invalidDBGames);
	}

	console.log(`Finished healing week ${week}`);
};

const healFutureWeeks = (currentWeek: TWeek): void => {
	const allSchedule = getEntireSeason();

	for (let week = currentWeek; week <= WEEKS_IN_SEASON; week++) {
		healWeek(week, allSchedule);
		healPicks(week);
	}
};

export const updateGames = (): void => {
	const week = (currentWeek.call({}) as unknown) as TWeek;

	healFutureWeeks(week);

	const firstGameOfWeek = (getFirstGameOfWeek.call(
		{ week },
		handleError,
	) as unknown) as TGame;
	const weekHasStarted = isAfter(firstGameOfWeek.kickoff, new Date());
	const weekToUpdate = weekHasStarted ? ((week + 1) as TWeek) : week;
	const games = getGamesForWeek(weekToUpdate);

	console.log(`Updating game info for week ${weekToUpdate}...`);

	games.forEach(
		(gameObj): void => {
			const hTeamData = getHomeTeamFromAPI(gameObj);
			const vTeamData = getVisitorTeamFromAPI(gameObj);

			if (!hTeamData || !vTeamData)
				throw new Meteor.Error(
					'Missing data',
					`Home team is ${hTeamData}, visitor is ${vTeamData}`,
				);

			const game = (findGame.call(
				{
					week: weekToUpdate,
					// eslint-disable-next-line @typescript-eslint/camelcase
					home_short: hTeamData.id,
					// eslint-disable-next-line @typescript-eslint/camelcase
					visitor_short: vTeamData.id,
				},
				handleError,
			) as unknown) as TGame;

			if (hTeamData.spread) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				game.home_spread = Math.round(parseFloat(hTeamData.spread) * 10) / 10;
			}

			if (vTeamData.spread) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				game.visitor_spread =
					Math.round(parseFloat(vTeamData.spread) * 10) / 10;
			}

			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			game.save();

			// Update home team data
			// eslint-disable-next-line @typescript-eslint/camelcase
			const hTeam: TTeam = getTeamByShortSync({ short_name: hTeamData.id });

			if (hTeamData.passDefenseRank) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				hTeam.pass_defense = parseInt(hTeamData.passDefenseRank, 10);
			}

			if (hTeamData.passOffenseRank) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				hTeam.pass_offense = parseInt(hTeamData.passOffenseRank, 10);
			}

			if (hTeamData.rushDefenseRank) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				hTeam.rush_defense = parseInt(hTeamData.rushDefenseRank, 10);
			}

			if (hTeamData.rushOffenseRank) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				hTeam.rush_offense = parseInt(hTeamData.rushOffenseRank, 10);
			}

			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			hTeam.save();

			// Update visiting team data
			// eslint-disable-next-line @typescript-eslint/camelcase
			const vTeam: TTeam = getTeamByShortSync({ short_name: vTeamData.id });

			if (vTeamData.passDefenseRank) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				vTeam.pass_defense = parseInt(vTeamData.passDefenseRank, 10);
			}

			if (vTeamData.passOffenseRank) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				vTeam.pass_offense = parseInt(vTeamData.passOffenseRank, 10);
			}

			if (vTeamData.rushDefenseRank) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				vTeam.rush_defense = parseInt(vTeamData.rushDefenseRank, 10);
			}

			if (vTeamData.rushOffenseRank) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				vTeam.rush_offense = parseInt(vTeamData.rushOffenseRank, 10);
			}

			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			vTeam.save();
		},
	);

	console.log(`Game info for week ${weekToUpdate} updated!`);
};

export const refreshGameData = (): string => {
	const weeksToRefresh = (getWeeksToRefresh.call({}) as unknown) as TWeek[];
	const allSchedule = getEntireSeason();

	// eslint-disable-next-line @typescript-eslint/camelcase
	toggleGamesUpdating.call({ is_updating: weeksToRefresh.length > 0 });

	weeksToRefresh.forEach(
		(w: TWeek): void => {
			healWeek(w, allSchedule);

			const games = getGamesForWeek(w);
			const gameCount = games.length;
			let completeCount = 0;
			let justCompleted = 0;
			let game: TGame;
			let hTeamData: TAPITeam;
			let vTeamData: TAPITeam;
			let hTeam;
			let vTeam;
			let winner;
			let status: TGameStatus;

			console.log(`Updating week ${w}, ${gameCount} games found`);

			games.every(
				(gameObj): boolean => {
					let wasComplete = false;

					gameObj.team.forEach(
						(team): void => {
							if (team.isHome === '1') hTeamData = team;

							if (team.isHome === '0') vTeamData = team;
						},
					);

					game = (findGame.call({
						week: w,
						// eslint-disable-next-line @typescript-eslint/camelcase
						home_short: hTeamData.id,
						// eslint-disable-next-line @typescript-eslint/camelcase
						visitor_short: vTeamData.id,
					}) as unknown) as TGame;

					status = game.status;

					if (status === 'C') {
						wasComplete = true;

						console.log(
							`Week ${w} game ${
								game.game
							} already complete, checking for updates...`,
						);
					} else if (game.kickoff > new Date()) {
						console.log(
							`Week ${w} game ${game.game} hasn't begun, skipping...`,
						);

						return true;
					}

					// eslint-disable-next-line @typescript-eslint/camelcase
					hTeam = getTeamByShortSync({ short_name: hTeamData.id });
					// eslint-disable-next-line @typescript-eslint/camelcase
					vTeam = getTeamByShortSync({ short_name: vTeamData.id });

					// Update and save this game
					const timeLeft = parseInt(gameObj.gameSecondsRemaining || '0', 10);

					if (timeLeft >= 3600) {
						status = 'P';
					} else if (timeLeft < 3600 && timeLeft > 2700) {
						status = '1';
					} else if (timeLeft <= 2700 && timeLeft > 1800) {
						status = '2';
					} else if (timeLeft === 1800) {
						status = 'H';
					} else if (timeLeft < 1800 && timeLeft > 900) {
						status = '3';
					} else if (timeLeft <= 900 && timeLeft > 0) {
						status = '4';
					} else if (timeLeft === 0) {
						if (hTeamData.score && vTeamData.score) status = 'C';
					} else {
						// timeLeft is less than 0
						status = 'I';
					}

					if (hTeamData.spread) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						game.home_spread =
							Math.round(parseFloat(hTeamData.spread) * 10) / 10;
					}

					if (hTeamData.score) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						game.home_score = parseInt(hTeamData.score, 10);
					}

					if (vTeamData.spread) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						game.visitor_spread =
							Math.round(parseFloat(vTeamData.spread) * 10) / 10;
					}

					if (vTeamData.score) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						game.visitor_score = parseInt(vTeamData.score, 10);
					}

					game.status = status;
					// eslint-disable-next-line @typescript-eslint/camelcase
					game.time_left = timeLeft;
					// eslint-disable-next-line @typescript-eslint/camelcase
					game.has_possession =
						hTeamData.hasPossession === '1'
							? 'H'
							: vTeamData.hasPossession === '1'
								? 'V'
								: null;
					// eslint-disable-next-line @typescript-eslint/camelcase
					game.in_redzone =
						hTeamData.inRedZone === '1'
							? 'H'
							: vTeamData.inRedZone === '1'
								? 'V'
								: null;

					if (status === 'C') {
						if (game.home_score > game.visitor_score) {
							winner = hTeam;
						} else if (game.home_score < game.visitor_score) {
							winner = vTeam;
						} else {
							// eslint-disable-next-line @typescript-eslint/camelcase
							winner = getTeamByShort.call({ short_name: 'TIE' });
						}

						// eslint-disable-next-line @typescript-eslint/camelcase
						game.winner_id = winner._id;
						// eslint-disable-next-line @typescript-eslint/camelcase
						game.winner_short = winner.short_name;
					}

					// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
					// @ts-ignore
					game.save();

					if (status !== 'P') {
						// Game has started, assign highest available point total to missed picks
						assignPointsToMissed.call(
							{ gameId: game._id, week: w },
							handleError,
						);
					}

					if (status === 'C') {
						completeCount++;

						if (!wasComplete) justCompleted++;

						// Update the team's history array
						// Updated 2016-09-13 to ensure history always gets filled in
						console.log(`Game ${game.game} complete, updating history...`);

						if (!hTeam.isInHistory(game._id)) {
							hTeam.history.push({
								week: w,
								// eslint-disable-next-line @typescript-eslint/camelcase
								game_id: game._id,
								// eslint-disable-next-line @typescript-eslint/camelcase
								opponent_id: vTeam._id,
								// eslint-disable-next-line @typescript-eslint/camelcase
								opponent_short: vTeam.short_name,
								// eslint-disable-next-line @typescript-eslint/camelcase
								was_home: true,
								// eslint-disable-next-line @typescript-eslint/camelcase
								did_win: game.winner_short === hTeam.short_name,
								// eslint-disable-next-line @typescript-eslint/camelcase
								did_tie: game.winner_short === 'TIE',
								// eslint-disable-next-line @typescript-eslint/camelcase
								final_score:
									game.home_score > game.visitor_score
										? `${game.home_score}-${game.visitor_score}`
										: `${game.visitor_score}-${game.home_score}`,
							});
						}

						if (!vTeam.isInHistory(game._id)) {
							vTeam.history.push({
								week: w,
								// eslint-disable-next-line @typescript-eslint/camelcase
								game_id: game._id,
								// eslint-disable-next-line @typescript-eslint/camelcase
								opponent_id: hTeam._id,
								// eslint-disable-next-line @typescript-eslint/camelcase
								opponent_short: hTeam.short_name,
								// eslint-disable-next-line @typescript-eslint/camelcase
								was_home: false,
								// eslint-disable-next-line @typescript-eslint/camelcase
								did_win: game.winner_short === vTeam.short_name,
								// eslint-disable-next-line @typescript-eslint/camelcase
								did_tie: game.winner_short === 'TIE',
								// eslint-disable-next-line @typescript-eslint/camelcase
								final_score:
									game.home_score > game.visitor_score
										? `${game.home_score}-${game.visitor_score}`
										: `${game.visitor_score}-${game.home_score}`,
							});
						}

						console.log(`Game ${game.game} history updated!`);
						// Update the picks for each user
						console.log(`Game ${game.game} complete, updating picks...`);
						// Changed the below to use the raw collection for performance (8 sec -> 5ms)
						// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
						// @ts-ignore
						Picks.update(
							// eslint-disable-next-line @typescript-eslint/camelcase
							{ game_id: game._id },
							{
								$set: {
									// eslint-disable-next-line @typescript-eslint/camelcase
									winner_id: game.winner_id,
									// eslint-disable-next-line @typescript-eslint/camelcase
									winner_short: game.winner_short,
								},
							},
							{ multi: true },
						);
						console.log(`Game ${game.game} picks updated!`);
						// Update the survivor pool
						console.log(`Game ${game.game} complete, updating survivor...`);
						// Changed the below to the raw collection for performance
						// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
						// @ts-ignore
						SurvivorPicks.update(
							// eslint-disable-next-line @typescript-eslint/camelcase
							{ game_id: game._id },
							{
								$set: {
									// eslint-disable-next-line @typescript-eslint/camelcase
									winner_id: game.winner_id,
									// eslint-disable-next-line @typescript-eslint/camelcase
									winner_short: game.winner_short,
								},
							},
							{ multi: true },
						);
						console.log(`Game ${game.game} survivor updated!`);
					}

					// Update home team data
					if (hTeamData.passDefenseRank) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						hTeam.pass_defense = parseInt(hTeamData.passDefenseRank, 10);
					}

					if (hTeamData.passOffenseRank) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						hTeam.pass_offense = parseInt(hTeamData.passOffenseRank, 10);
					}

					if (hTeamData.rushDefenseRank) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						hTeam.rush_defense = parseInt(hTeamData.rushDefenseRank, 10);
					}

					if (hTeamData.rushOffenseRank) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						hTeam.rush_offense = parseInt(hTeamData.rushOffenseRank, 10);
					}

					hTeam.save();

					// Update visiting team data
					if (vTeamData.passDefenseRank) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						vTeam.pass_defense = parseInt(vTeamData.passDefenseRank, 10);
					}

					if (vTeamData.passOffenseRank) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						vTeam.pass_offense = parseInt(vTeamData.passOffenseRank, 10);
					}

					if (vTeamData.rushDefenseRank) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						vTeam.rush_defense = parseInt(vTeamData.rushDefenseRank, 10);
					}

					if (vTeamData.rushOffenseRank) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						vTeam.rush_offense = parseInt(vTeamData.rushOffenseRank, 10);
					}

					vTeam.save();

					console.log(`Week ${w} game ${game.game} successfully updated!`);

					return true;
				},
			);

			if (gameCount === completeCount) {
				console.log(`Week ${w} complete, updating tiebreakers...`);
				updateLastGameOfWeekScore.call({ week: w });
				console.log(`Week ${w} tiebreakers successfully updated!`);
			}

			console.log(`Finished updating games for week ${w}!`);

			// Updated 2016-09-13 to improve update performance
			if (justCompleted > 0 || gameCount === completeCount) {
				console.log(
					`${
						gameCount === completeCount
							? `All games complete for week ${w}`
							: `${justCompleted} games newly complete for week ${w}`
					}, now updating users...`,
				);

				const leagues = (getAllLeagues.call({}) as unknown) as string[];

				leagues.forEach(
					(league): void => {
						updatePoints.call({ league });
						updatePlaces.call({ league, week: w });
						updateSurvivor.call({ league, week: w });
					},
				);

				if (gameCount === completeCount)
					endOfWeekMessage.call({ week: w }, handleError);

				console.log(`Finished updating users for week ${w}!`);
			}

			console.log(`Week ${w} successfully updated!`);
		},
	);

	// eslint-disable-next-line @typescript-eslint/camelcase
	toggleGamesUpdating.call({ is_updating: false });

	return `Successfully updated all weeks in list: ${weeksToRefresh}`;
};
