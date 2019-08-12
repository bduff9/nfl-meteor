import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Meteor } from 'meteor/meteor';

import { Game, currentWeek, TGame } from '../../imports/api/collections/games';
import { TUser } from '../../imports/api/collections/users';
import { TGameNumber, TWeek } from '../../imports/api/commonTypes';
import { populateGames, refreshGameData } from '../api-calls';

import { addPick, getPick, removeAllPicksForUser } from './picks';
import {
	addSurvivorPick,
	removeAllSurvivorPicksForUser,
} from './survivorpicks';
import {
	addTiebreaker,
	getTiebreakerFromServer,
	removeAllTiebreakersForUser,
} from './tiebreakers';
import { getLowestScore } from './users';

/**
 * All server side game logic
 */

export const clearGames = new ValidatedMethod({
	name: 'Games.clearGames',
	validate: new SimpleSchema({}).validator(),
	run(): void {
		Game.remove({});
	},
});
export const clearGamesSync = Meteor.wrapAsync(clearGames.call, clearGames);

export type TEmptyPick = {
	game: TGameNumber;
	game_id: string;
	league: string;
	user_id: string;
	week: TWeek;
};

export const getEmptyUserPicks = new ValidatedMethod({
	name: 'Games.getEmptyUserPicks',
	validate: new SimpleSchema({
		leagues: { type: [String], label: 'Leagues' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: { type: String, label: 'User ID' },
	}).validator(),
	// eslint-disable-next-line @typescript-eslint/camelcase
	run({ leagues, user_id }: { leagues: string[]; user_id: string }): void {
		const currWeek: TWeek = currentWeek.call({});

		leagues.forEach(
			(league): void => {
				let lowestScoreUser: TUser | null = null;

				if (currWeek > 1)
					lowestScoreUser = getLowestScore.call({
						// eslint-disable-next-line @typescript-eslint/camelcase
						current_user_ids: [user_id],
						league,
						week: currWeek,
					});

				const picks: TEmptyPick[] = Game.find(
					{},
					{ sort: { week: 1, game: 1 } },
				).map(
					(game: TGame): TEmptyPick => ({
						// eslint-disable-next-line @typescript-eslint/camelcase
						user_id,
						league,
						week: game.week,
						// eslint-disable-next-line @typescript-eslint/camelcase
						game_id: game._id,
						game: game.game,
					}),
				);

				// eslint-disable-next-line @typescript-eslint/camelcase
				removeAllPicksForUser.call({ league, user_id });
				picks.forEach(
					(pick): void => {
						let pickToAdd = pick;
						let lowScorePick = null;

						if (lowestScoreUser && pick.week < currWeek) {
							lowScorePick = getPick.call({
								// eslint-disable-next-line @typescript-eslint/camelcase
								game_id: pick.game_id,
								league,
								// eslint-disable-next-line @typescript-eslint/camelcase
								user_id: lowestScoreUser._id,
							});
							const {
								// eslint-disable-next-line @typescript-eslint/camelcase
								pick_id,
								// eslint-disable-next-line @typescript-eslint/camelcase
								pick_short,
								points,
								// eslint-disable-next-line @typescript-eslint/camelcase
								winner_id,
								// eslint-disable-next-line @typescript-eslint/camelcase
								winner_short,
							} = lowScorePick;

							pickToAdd = Object.assign({}, pick, {
								// eslint-disable-next-line @typescript-eslint/camelcase
								pick_id,
								// eslint-disable-next-line @typescript-eslint/camelcase
								pick_short,
								points,
								// eslint-disable-next-line @typescript-eslint/camelcase
								winner_id,
								// eslint-disable-next-line @typescript-eslint/camelcase
								winner_short,
							});

							if (pick.game === 1) {
								const lowestTB = getTiebreakerFromServer.call({
									league,
									// eslint-disable-next-line @typescript-eslint/camelcase
									user_id: lowestScoreUser._id,
									week: pick.week,
								});
								const userTB = getTiebreakerFromServer.call({
									league,
									// eslint-disable-next-line @typescript-eslint/camelcase
									user_id,
									week: pick.week,
								});
								const {
									// eslint-disable-next-line @typescript-eslint/camelcase
									last_score,
									// eslint-disable-next-line @typescript-eslint/camelcase
									last_score_act,
									// eslint-disable-next-line @typescript-eslint/camelcase
									points_earned,
									// eslint-disable-next-line @typescript-eslint/camelcase
									games_correct,
									// eslint-disable-next-line @typescript-eslint/camelcase
									place_in_week,
								} = lowestTB;

								// eslint-disable-next-line @typescript-eslint/camelcase
								lowestTB.tied_flag = true;
								lowestTB.save();
								// eslint-disable-next-line @typescript-eslint/camelcase
								userTB.last_score = last_score;
								// eslint-disable-next-line @typescript-eslint/camelcase
								userTB.last_score_act = last_score_act;
								// eslint-disable-next-line @typescript-eslint/camelcase
								// eslint-disable-next-line @typescript-eslint/camelcase
								userTB.points_earned = points_earned;
								// eslint-disable-next-line @typescript-eslint/camelcase
								userTB.games_correct = games_correct;
								// eslint-disable-next-line @typescript-eslint/camelcase
								userTB.place_in_week = place_in_week;
								// eslint-disable-next-line @typescript-eslint/camelcase
								userTB.tied_flag = true;
								userTB.submitted = true;
								userTB.save();
							}
						}

						addPick.call({ pick: pickToAdd });
					},
				);
			},
		);
	},
});
export const getEmptyUserPicksSync = Meteor.wrapAsync(
	getEmptyUserPicks.call,
	getEmptyUserPicks,
);

export type TEmptySurvivorPick = {
	league: string;
	user_id: string;
	week: TWeek;
};

export const getEmptyUserSurvivorPicks = new ValidatedMethod({
	name: 'Games.getEmptyUserSurvivorPicks',
	validate: new SimpleSchema({
		leagues: { type: [String], label: 'Leagues' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: { type: String, label: 'User ID' },
	}).validator(),
	// eslint-disable-next-line @typescript-eslint/camelcase
	run({ leagues, user_id }: { leagues: string[]; user_id: string }): void {
		leagues.forEach(
			(league): void => {
				const survivorPicks: TEmptySurvivorPick[] = Game.find(
					{ game: 1 },
					{ sort: { week: 1 } },
				).map(
					(game: TGame): TEmptySurvivorPick => ({
						// eslint-disable-next-line @typescript-eslint/camelcase
						user_id,
						league,
						week: game.week,
					}),
				);

				// eslint-disable-next-line @typescript-eslint/camelcase
				removeAllSurvivorPicksForUser.call({ league, user_id });
				survivorPicks.forEach(
					(survivorPick): void => addSurvivorPick.call({ survivorPick }),
				);
			},
		);
	},
});
export const getEmptyUserSurvivorPicksSync = Meteor.wrapAsync(
	getEmptyUserSurvivorPicks.call,
	getEmptyUserSurvivorPicks,
);

export type TEmptyTiebreaker = {
	league: string;
	user_id: string;
	week: TWeek;
};

export const getEmptyUserTiebreakers = new ValidatedMethod({
	name: 'Games.getEmptyUserTiebreakers',
	validate: new SimpleSchema({
		leagues: { type: [String], label: 'Leagues' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: { type: String, label: 'User ID' },
	}).validator(),
	// eslint-disable-next-line @typescript-eslint/camelcase
	run({ leagues, user_id }: { leagues: string[]; user_id: string }): void {
		leagues.forEach(
			(league): void => {
				const tiebreakers: TEmptyTiebreaker[] = Game.find(
					{ game: 1 },
					{ sort: { week: 1 } },
				).map(
					(game: TGame): TEmptyTiebreaker => ({
						// eslint-disable-next-line @typescript-eslint/camelcase
						user_id,
						league,
						week: game.week,
					}),
				);

				// eslint-disable-next-line @typescript-eslint/camelcase
				removeAllTiebreakersForUser.call({ league, user_id });
				tiebreakers.forEach(
					(tiebreaker): void => {
						addTiebreaker.call({ tiebreaker });
					},
				);
			},
		);
	},
});
export const getEmptyUserTiebreakersSync = Meteor.wrapAsync(
	getEmptyUserTiebreakers.call,
	getEmptyUserTiebreakers,
);

export const initSchedule = new ValidatedMethod({
	name: 'Games.insert',
	validate: new SimpleSchema({}).validator(),
	run(): void {
		populateGames();
	},
});
export const initScheduleSync = Meteor.wrapAsync(
	initSchedule.call,
	initSchedule,
);

export const refreshGames = new ValidatedMethod({
	name: 'Games.refreshGameData',
	validate: new SimpleSchema({}).validator(),
	run(): string {
		const gamesInProgress = Game.find({
			game: { $ne: 0 },
			status: { $ne: 'C' },
			kickoff: { $lte: new Date() },
		}).count();

		if (gamesInProgress === 0)
			throw new Meteor.Error(
				'No games found',
				'There are no games currently in progress',
			);

		return refreshGameData();
	},
});
export const refreshGamesSync = Meteor.wrapAsync(
	refreshGames.call,
	refreshGames,
);

export const removeBonusPointGames = new ValidatedMethod({
	name: 'Games.removeBonusPointGames',
	validate: new SimpleSchema({}).validator(),
	run(): void {
		Game.remove({ game: 0 }, { multi: true });
	},
});
export const removeBonusPointGamesSync = Meteor.wrapAsync(
	removeBonusPointGames.call,
	removeBonusPointGames,
);
