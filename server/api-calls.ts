import { isAfter } from 'date-fns';
import { HTTP } from 'meteor/http';
import { Meteor } from 'meteor/meteor';

import { assignPointsToMissed, Picks } from '../imports/api/collections/picks';
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
	getAllLeagues,
	updatePlaces,
	updatePoints,
	updateSurvivor,
} from '../imports/api/collections/users';
import { TWeek, TGameNumber, TGameStatus } from '../imports/api/commonTypes';
import { WEEKS_IN_SEASON } from '../imports/api/constants';
import { convertEpoch, handleError } from '../imports/api/global';
import {
	currentWeek,
	findGame,
	getFirstGameOfWeek,
	getWeeksToRefresh,
	insertGame,
	TGame,
} from '../imports/api/collections/games';

import { insertAPICall } from './collections/apicalls';
import { endOfWeekMessage } from './collections/nfllogs';
import { updateLastGameOfWeekScore } from './collections/tiebreakers';

export type TAPIBoolean = '0' | '1';
export type TAPITeam = {
	inRedZone: TAPIBoolean;
	score: number;
	hasPossession: TAPIBoolean;
	passOffenseRank: string;
	rushOffenseRank: string;
	passDefenseRank: string;
	spread: string;
	isHome: TAPIBoolean;
	id: string;
	rushDefenseRank: string;
};
export type TAPIMatchup = {
	kickoff: string;
	gameSecondsRemaining: string;
	team: TAPITeam[];
};

export const getGamesForWeek = (week: TWeek): TAPIMatchup[] => {
	const systemVals: TSystemVals = getSystemValues.call({});
	const currYear = systemVals.year_updated;
	const data = { TYPE: 'nflSchedule', JSON: '1', W: `${week}` };
	let url;

	if (Meteor.settings.mode === 'production' || !Meteor.settings.apiHost) {
		url = 'http://www03.myfantasyleague.com';
	} else {
		url = Meteor.settings.apiHost;
	}

	url += `/${currYear}/export`;

	try {
		const response = HTTP.get(url, { params: data });

		insertAPICall.call({ response: response.data, url, week, year: currYear });

		return response.data.nflSchedule.matchup;
	} catch (error) {
		insertAPICall.call({ error, response: null, url, week, year: currYear });

		return [];
	}
};

export const populateGamesForWeek = (w: TWeek): void => {
	const games = getGamesForWeek(w);
	let game: TGame;
	let hTeamData: TAPITeam;
	let vTeamData: TAPITeam;
	let hTeam;
	let vTeam;

	console.log('Week ' + w + ': ' + games.length + ' games');

	games.forEach(
		(gameObj, i): void => {
			gameObj.team.forEach(
				(team): void => {
					if (team.isHome === '1') hTeamData = team;

					if (team.isHome === '0') vTeamData = team;
				},
			);

			// eslint-disable-next-line @typescript-eslint/camelcase
			hTeam = getTeamByShortSync({ short_name: hTeamData.id });
			// eslint-disable-next-line @typescript-eslint/camelcase
			vTeam = getTeamByShortSync({ short_name: vTeamData.id });

			// Create and save this game
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			game = {
				week: w,
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
	for (let w = 1; w <= WEEKS_IN_SEASON; w++) populateGamesForWeek(w as TWeek);
};

export const updateGames = (): void => {
	const week: TWeek = currentWeek.call();
	const firstGameOfWeek: TGame = getFirstGameOfWeek.call({ week }, handleError);
	const weekHasStarted = isAfter(firstGameOfWeek.kickoff, new Date());
	const weekToUpdate = weekHasStarted ? ((week + 1) as TWeek) : week;
	const games = getGamesForWeek(weekToUpdate);

	console.log(`Updating game info for week ${weekToUpdate}...`);

	games.forEach(
		(gameObj): void => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			const hTeamData: TAPITeam = gameObj.team.find(
				(team): boolean => team.isHome === '1',
			);
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			const vTeamData: TAPITeam = gameObj.team.find(
				(team): boolean => team.isHome === '0',
			);

			const game: TGame = findGame.call(
				{
					week: weekToUpdate,
					// eslint-disable-next-line @typescript-eslint/camelcase
					home_short: hTeamData.id,
					// eslint-disable-next-line @typescript-eslint/camelcase
					visitor_short: vTeamData.id,
				},
				handleError,
			);

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
	const weeksToRefresh: TWeek[] = getWeeksToRefresh.call({});
	let games: TAPIMatchup[];
	let gameCount: number;
	let completeCount: number;
	let justCompleted: number;
	let game: TGame;
	let hTeamData: TAPITeam;
	let vTeamData: TAPITeam;
	let hTeam;
	let vTeam;
	let winner;
	let status: TGameStatus;

	// eslint-disable-next-line @typescript-eslint/camelcase
	toggleGamesUpdating.call({ is_updating: weeksToRefresh.length > 0 });

	weeksToRefresh.forEach(
		(w: TWeek): void => {
			games = getGamesForWeek(w);
			gameCount = games.length;
			completeCount = 0;
			justCompleted = 0;

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

					game = findGame.call({
						week: w,
						// eslint-disable-next-line @typescript-eslint/camelcase
						home_short: hTeamData.id,
						// eslint-disable-next-line @typescript-eslint/camelcase
						visitor_short: vTeamData.id,
					});

					if (game.status === 'C') {
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
						status = 'C';
					} else {
						// timeLeft is less than 0
						status = 'I';
					}

					if (hTeamData.spread) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						game.home_spread =
							Math.round(parseFloat(hTeamData.spread) * 10) / 10;
					}

					// eslint-disable-next-line @typescript-eslint/camelcase
					game.home_score = hTeamData.score || 0;

					if (vTeamData.spread) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						game.visitor_spread =
							Math.round(parseFloat(vTeamData.spread) * 10) / 10;
					}

					// eslint-disable-next-line @typescript-eslint/camelcase
					game.visitor_score = vTeamData.score || 0;
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

				const leagues: string[] = getAllLeagues.call({});

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
