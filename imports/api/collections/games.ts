import { uniq } from 'lodash';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import { TWeek, TGameNumber, TGameStatus, TGameTeam } from '../commonTypes';
import {
	MAX_GAMES_IN_WEEK,
	MIN_WEEK,
	PAYMENT_DUE_WEEK,
	WEEKS_IN_SEASON,
} from '../constants';

import { getTeamByID, TTeam } from './teams';

export type TGetTeam = <W extends TGameTeam>(
	w: W,
) => W extends 'winner' ? TTeam | null : TTeam;
export type TGame = {
	_id: string;
	week: TWeek;
	game: TGameNumber;
	home_id: string;
	home_short: string;
	home_spread?: number | null;
	home_score: number;
	visitor_id: string;
	visitor_short: string;
	visitor_spread?: number | null;
	visitor_score: number;
	winner_id?: string | null;
	winner_short?: string | null;
	status: TGameStatus;
	kickoff: Date;
	time_left: number;
	has_possession?: string | null;
	in_redzone?: string | null;
	notFound?: boolean;
	getTeam: TGetTeam;
};

/**
 * Game schema
 */
const Games = new Mongo.Collection('games');
export const Game = Class.create({
	name: 'Game',
	collection: Games,
	secured: true,
	fields: {
		week: {
			type: Number,
			validators: [
				{
					type: 'and',
					param: [
						{ type: 'required' },
						{ type: 'gte', param: 1 },
						{ type: 'lte', param: 17 },
					],
				},
			],
		},
		game: {
			type: Number,
			validators: [
				{
					type: 'and',
					param: [
						{ type: 'required' },
						{ type: 'gte', param: 0 },
						{ type: 'lte', param: 16 },
					],
				},
			],
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		home_id: String,
		// eslint-disable-next-line @typescript-eslint/camelcase
		home_short: {
			type: String,
			validators: [{ type: 'length', param: 3 }],
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		home_spread: {
			type: Number,
			optional: true,
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		home_score: {
			type: Number,
			validators: [{ type: 'gte', param: 0 }],
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		visitor_id: String,
		// eslint-disable-next-line @typescript-eslint/camelcase
		visitor_short: {
			type: String,
			validators: [{ type: 'length', param: 3 }],
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		visitor_spread: {
			type: Number,
			optional: true,
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		visitor_score: {
			type: Number,
			validators: [{ type: 'gte', param: 0 }],
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		winner_id: {
			type: String,
			optional: true,
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		winner_short: {
			type: String,
			validators: [{ type: 'length', param: 3 }],
			optional: true,
		},
		status: {
			type: String,
			validators: [
				{ type: 'choice', param: ['P', 'I', '1', '2', 'H', '3', '4', 'C'] },
			],
		},
		kickoff: Date,
		// eslint-disable-next-line @typescript-eslint/camelcase
		time_left: {
			type: Number,
			validators: [
				{
					type: 'and',
					param: [{ type: 'gte', param: 0 }, { type: 'lte', param: 3600 }],
				},
			],
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		has_possession: {
			type: String,
			validators: [{ type: 'choice', param: ['H', 'V'] }],
			optional: true,
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		in_redzone: {
			type: String,
			validators: [{ type: 'choice', param: ['H', 'V'] }],
			optional: true,
		},
	},
	helpers: {
		getTeam (which: TGameTeam): TTeam | null {
			let teamId;

			if (which === 'home') {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				teamId = this.home_id;
			} else if (which === 'visitor') {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				teamId = this.visitor_id;
			} else if (which === 'winner') {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				teamId = this.winner_id;
			} else {
				console.error('Incorrect type passed', which);

				return null;
			}

			return getTeamByID.call({ teamId });
		},
	},
	indexes: {
		gameOrder: {
			fields: {
				week: 1,
				game: 1,
			},
			options: {
				unique: true,
			},
		},
		games: {
			fields: {
				game: 1,
			},
			options: {},
		},
		incompleteGames: {
			fields: {
				game: 1,
				status: 1,
			},
			options: {},
		},
		gameFindAPI: {
			fields: {
				week: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				home_short: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				visitor_short: 1,
			},
			options: {
				unique: true,
			},
		},
	},
	meteorMethods: {},
});

/**
 * All game collection logic
 */

export const currentWeek = new ValidatedMethod<{}>({
	name: 'Games.getCurrentWeek',
	validate: new SimpleSchema({}).validator(),
	run (): TWeek {
		const currTime = Math.round(new Date().getTime() / 1000);
		const nextGame = Game.find(
			{ status: 'P' },
			{ sort: { kickoff: 1 } },
		).fetch()[0];
		let currWeek;
		let startOfNextWeek;

		if (!nextGame) return WEEKS_IN_SEASON;

		if (nextGame.game === 1) {
			startOfNextWeek =
				Math.round(nextGame.kickoff.getTime() / 1000) - 24 * 3600;
			currWeek =
				currTime >= startOfNextWeek ? nextGame.week : nextGame.week - 1;
		} else {
			currWeek = nextGame.week;
		}

		if (currWeek < MIN_WEEK) return MIN_WEEK;

		if (currWeek > WEEKS_IN_SEASON) return WEEKS_IN_SEASON;

		return currWeek;
	},
});
export const currentWeekSync = Meteor.wrapAsync(currentWeek.call, currentWeek);

export type TFindGameProps = {
	home_short: string;
	visitor_short: string;
	week: TWeek;
};
export const findGame = new ValidatedMethod<TFindGameProps>({
	name: 'Games.findGame',
	validate: new SimpleSchema({
		// eslint-disable-next-line @typescript-eslint/camelcase
		home_short: { type: String, label: 'Home Short Name' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		visitor_short: { type: String, label: 'Visitor Short Name' },
		week: { type: Number, label: 'Week' },
	}).validator(),
	// eslint-disable-next-line @typescript-eslint/camelcase
	run ({ home_short, visitor_short, week }: TFindGameProps): TGame {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const game = Game.findOne({ home_short, visitor_short, week });

		if (!game)
			throw new Meteor.Error(
				// eslint-disable-next-line @typescript-eslint/camelcase
				`No game found in week ${week} between ${home_short} and ${visitor_short}`,
			);

		return game;
	},
});
export const findGameSync = Meteor.wrapAsync(findGame.call, findGame);

export type TGameHasStartedProps = { gameId: string };
export const gameHasStarted = new ValidatedMethod<TGameHasStartedProps>({
	name: 'Games.gameHasStarted',
	validate: new SimpleSchema({
		gameId: { type: String, label: 'Game ID' },
	}).validator(),
	run ({ gameId }: TGameHasStartedProps): boolean {
		const game = Game.findOne(gameId);
		const now = new Date();

		if (!game) throw new Meteor.Error('No game found!');

		return game.kickoff < now;
	},
});
export const gameHasStartedSync = Meteor.wrapAsync(
	gameHasStarted.call,
	gameHasStarted,
);

export const gamesExist = new ValidatedMethod<{}>({
	name: 'Games.gamesExist',
	validate: new SimpleSchema({}).validator(),
	run (): boolean {
		return Game.find().count() > 0;
	},
});
export const gamesExistSync = Meteor.wrapAsync(gamesExist.call, gamesExist);

export type TGetFirstGameOfWeekProps = { week: TWeek };
export const getFirstGameOfWeek = new ValidatedMethod<TGetFirstGameOfWeekProps>(
	{
		name: 'Games.getFirstGameOfWeek',
		validate: new SimpleSchema({
			week: { type: Number, label: 'Week', min: 1, max: 17 },
		}).validator(),
		run ({ week }: TGetFirstGameOfWeekProps): TGame {
			const firstGame = Game.findOne({ week, game: 1 });

			if (!firstGame)
				throw new Meteor.Error(`No game 1 found for week ${week}`);

			return firstGame;
		},
	},
);
export const getFirstGameOfWeekSync = Meteor.wrapAsync(
	getFirstGameOfWeek.call,
	getFirstGameOfWeek,
);

export type TGetLastGameOfWeekProps = { week: TWeek };
export const getLastGameOfWeek = new ValidatedMethod<TGetLastGameOfWeekProps>({
	name: 'Games.getLastGameOfWeek',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({ week }: TGetLastGameOfWeekProps): TGame {
		const game = Game.findOne({ week }, { sort: { game: -1 } });

		if (!game) throw new Meteor.Error(`No games found for week ${week}`);

		return game;
	},
});
export const getLastGameOfWeekSync = Meteor.wrapAsync(
	getLastGameOfWeek.call,
	getLastGameOfWeek,
);

export type TGetGameByIDProps = { gameId: string };
export const getGameByID = new ValidatedMethod<TGetGameByIDProps>({
	name: 'Games.getGameByID',
	validate: new SimpleSchema({
		gameId: { type: String, label: 'Game ID' },
	}).validator(),
	run ({ gameId }: TGetGameByIDProps): TGame {
		const game = Game.findOne(gameId);

		if (!game) throw new Meteor.Error('No game found!');

		return game;
	},
});
export const getGameByIDSync = Meteor.wrapAsync(getGameByID.call, getGameByID);

export type TGetGamesForWeekProps = { week: TWeek };
export const getGamesForWeek = new ValidatedMethod<TGetGamesForWeekProps>({
	name: 'Games.getGamesForWeek',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({ week }: TGetGamesForWeekProps): TGame[] {
		const games = Game.find({ week }, { sort: { game: 1 } }).fetch();

		if (!games) throw new Meteor.Error(`No games found for week ${week}`);

		return games;
	},
});
export const getGamesForWeekSync = Meteor.wrapAsync(
	getGamesForWeek.call,
	getGamesForWeek,
);

export const getNextGame = new ValidatedMethod<{}>({
	name: 'Games.getNextGame',
	validate: new SimpleSchema({}).validator(),
	run (): TGame {
		const nextGame = Game.find(
			{ status: 'P' },
			{ sort: { kickoff: 1 } },
		).fetch()[0];

		if (!nextGame)
			return {
				week: WEEKS_IN_SEASON,
				game: MAX_GAMES_IN_WEEK,
				notFound: true,
			} as TGame;

		return nextGame;
	},
});
export const getNextGameSync = Meteor.wrapAsync(getNextGame.call, getNextGame);

export const getNextGame1 = new ValidatedMethod<{}>({
	name: 'Games.getNextGame1',
	validate: new SimpleSchema({}).validator(),
	run (): TGame {
		const nextGame1 = Game.find(
			{ game: 1, status: 'P' },
			{ sort: { kickoff: 1 } },
		).fetch()[0];

		if (!nextGame1)
			return {
				week: WEEKS_IN_SEASON,
				game: MAX_GAMES_IN_WEEK,
				notFound: true,
			} as TGame;

		return nextGame1;
	},
});
export const getNextGame1Sync = Meteor.wrapAsync(
	getNextGame1.call,
	getNextGame1,
);

export const getPaymentDue = new ValidatedMethod<{}>({
	name: 'Games.getPaymentDue',
	validate: new SimpleSchema({}).validator(),
	run (): Date {
		const week3Games = Game.find(
			{ week: PAYMENT_DUE_WEEK },
			{ sort: { game: -1 }, limit: 1 },
		).fetch();

		if (!week3Games)
			throw new Meteor.Error(
				'Games.getPaymentDue.noGamesFound',
				'No games found for week 3',
			);

		return week3Games[0].kickoff;
	},
});
export const getPaymentDueSync = Meteor.wrapAsync(
	getPaymentDue.call,
	getPaymentDue,
);

export type TGetUnstartedGamesForWeek = { week: TWeek };
export const getUnstartedGamesForWeek = new ValidatedMethod<
	TGetUnstartedGamesForWeek
>({
	name: 'Games.getUnstartedGamesForWeek',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week' },
	}).validator(),
	run ({ week }: TGetUnstartedGamesForWeek): TGame[] {
		const unstartedGames = Game.find({ status: 'P', week }).fetch();

		return unstartedGames;
	},
});
export const getUnstartedGamesForWeekSync = Meteor.wrapAsync(
	getUnstartedGamesForWeek.call,
	getUnstartedGamesForWeek,
);

export const getWeeksToRefresh = new ValidatedMethod<{}>({
	name: 'Games.getWeeksToRefresh',
	validate: new SimpleSchema({}).validator(),
	run (): TWeek[] {
		const weeks: TWeek[] = uniq(
			Game.find(
				{
					status: { $ne: 'C' },
					kickoff: { $lte: new Date() },
				},
				{
					sort: { week: 1 },
					fields: { week: 1 },
				},
			).map((game: TGame): TWeek => game.week),
		);

		if (!weeks) throw new Meteor.Error('No weeks found to refresh!');

		return weeks;
	},
});
export const getWeeksToRefreshSync = Meteor.wrapAsync(
	getWeeksToRefresh.call,
	getWeeksToRefresh,
);

export type TInsertGameProps = { game: TGame };
export const insertGame = new ValidatedMethod<TInsertGameProps>({
	name: 'Games.insertGame',
	validate: new SimpleSchema({
		game: { type: Object, label: 'Game Object', blackbox: true },
	}).validator(),
	run ({ game }: TInsertGameProps): void {
		const newGame = new Game(game);

		newGame.save();
	},
});
export const insertGameSync = Meteor.wrapAsync(insertGame.call, insertGame);
