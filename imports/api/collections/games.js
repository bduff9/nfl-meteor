/* globals _ */
'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { MAX_GAMES_IN_WEEK, MIN_WEEK, PAYMENT_DUE_WEEK, WEEKS_IN_SEASON } from '../constants';
import { getTeamByID } from './teams';

/**
 * All game collection logic
 */

export const currentWeek = new ValidatedMethod({
	name: 'Games.getCurrentWeek',
	validate: new SimpleSchema({}).validator(),
	run () {
		const currTime = Math.round(new Date().getTime() / 1000),
				nextGame = Game.find({ status: 'P' }, { sort: { kickoff: 1 } }).fetch()[0];
		let currWeek, startOfNextWeek;
		if (!nextGame) return WEEKS_IN_SEASON;
		if (nextGame.game === 1) {
			startOfNextWeek = Math.round(nextGame.kickoff.getTime() / 1000) - (24 * 3600);
			currWeek = currTime >= startOfNextWeek ? nextGame.week : nextGame.week - 1;
		} else {
			currWeek = nextGame.week;
		}
		if (currWeek < MIN_WEEK) return MIN_WEEK;
		if (currWeek > WEEKS_IN_SEASON) return WEEKS_IN_SEASON;
		return currWeek;
	}
});
export const currentWeekSync = Meteor.wrapAsync(currentWeek.call, currentWeek);

export const findGame = new ValidatedMethod({
	name: 'Games.findGame',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week' },
		home_short: { type: String, label: 'Home Short Name' },
		visitor_short: { type: String, label: 'Visitor Short Name' }
	}).validator(),
	run ({ week, home_short, visitor_short }) {
		const game = Game.findOne({ week, home_short, visitor_short });
		if (!game) throw new Meteor.Error(`No game found in week ${week} between ${home_short} and ${visitor_short}`);
		return game;
	}
});
export const findGameSync = Meteor.wrapAsync(findGame.call, findGame);

export const gameHasStarted = new ValidatedMethod({
	name: 'Games.gameHasStarted',
	validate: new SimpleSchema({
		gameId: { type: String, label: 'Game ID' }
	}).validator(),
	run ({ gameId }) {
		const game = Game.findOne(gameId);
		const now = new Date();
		if (!game) throw new Meteor.Error('No game found!');
		return (game.kickoff < now);
	}
});
export const gameHasStartedSync = Meteor.wrapAsync(gameHasStarted.call, gameHasStarted);

export const gamesExist = new ValidatedMethod({
	name: 'Games.gamesExist',
	validate: new SimpleSchema({}).validator(),
	run () {
		return Game.find().count() > 0;
	}
});
export const gamesExistSync = Meteor.wrapAsync(gamesExist.call, gamesExist);

export const getFirstGameOfWeek = new ValidatedMethod({
	name: 'Games.getFirstGameOfWeek',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ week }) {
		const firstGame = Game.findOne({ week, game: 1 });
		if (!firstGame) throw new Meteor.Error(`No game 1 found for week ${week}`);
		return firstGame;
	}
});
export const getFirstGameOfWeekSync = Meteor.wrapAsync(getFirstGameOfWeek.call, getFirstGameOfWeek);

export const getLastGameOfWeek = new ValidatedMethod({
	name: 'Games.getLastGameOfWeek',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ week }) {
		const game = Game.findOne({ week }, { sort: { game: -1 }});
		if (!game) throw new Meteor.Error(`No games found for week ${week}`);
		return game;
	}
});
export const getLastGameOfWeekSync = Meteor.wrapAsync(getLastGameOfWeek.call, getLastGameOfWeek);

export const getGameByID = new ValidatedMethod({
	name: 'Games.getGameByID',
	validate: new SimpleSchema({
		gameId: { type: String, label: 'Game ID' }
	}).validator(),
	run ({ gameId }) {
		const game = Game.findOne(gameId);
		if (!game) throw Meteor.Error('No game found!');
		return game;
	}
});
export const getGameByIDSync = Meteor.wrapAsync(getGameByID.call, getGameByID);

export const getGamesForWeek = new ValidatedMethod({
	name: 'Games.getGamesForWeek',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ week }) {
		const games = Game.find({ week }, { sort: { game: 1 }}).fetch();
		if (!games) throw new Meteor.Error(`No games found for week ${week}`);
		return games;
	}
});
export const getGamesForWeekSync = Meteor.wrapAsync(getGamesForWeek.call, getGamesForWeek);

export const getNextGame = new ValidatedMethod({
	name: 'Games.getNextGame',
	validate: new SimpleSchema({}).validator(),
	run () {
		const nextGame = Game.find({ status: 'P' }, { sort: { kickoff: 1 } }).fetch()[0];
		if (!nextGame) return { week: WEEKS_IN_SEASON, game: MAX_GAMES_IN_WEEK, notFound: true };
		return nextGame;
	}
});
export const getNextGameSync = Meteor.wrapAsync(getNextGame.call, getNextGame);

export const getNextGame1 = new ValidatedMethod({
	name: 'Games.getNextGame1',
	validate: new SimpleSchema({}).validator(),
	run () {
		const nextGame1 = Game.find({ game: 1, status: 'P' }, { sort: { kickoff: 1 }}).fetch()[0];
		if (!nextGame1) return { week: WEEKS_IN_SEASON, game: MAX_GAMES_IN_WEEK, notFound: true };
		return nextGame1;
	}
});
export const getNextGame1Sync = Meteor.wrapAsync(getNextGame1.call, getNextGame1);

export const getPaymentDue = new ValidatedMethod({
	name: 'Games.getPaymentDue',
	validate: new SimpleSchema({}).validator(),
	run () {
		const week3Games = Game.find({ week: PAYMENT_DUE_WEEK }, { sort: { game: -1 }, limit: 1 }).fetch();
		if (!week3Games) throw new Meteor.Error('Games.getPaymentDue.noGamesFound', 'No games found for week 3');
		return week3Games[0].kickoff;
	}
});
export const getPaymentDueSync = Meteor.wrapAsync(getPaymentDue.call, getPaymentDue);

export const getUnstartedGamesForWeek = new ValidatedMethod({
	name: 'Games.getUnstartedGamesForWeek',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week' }
	}).validator(),
	run ({ week }) {
		const unstartedGames = Game.find({ status: 'P', week }).fetch();
		return unstartedGames;
	}
});
export const getUnstartedGamesForWeekSync = Meteor.wrapAsync(getUnstartedGamesForWeek.call, getUnstartedGamesForWeek);

export const getWeeksToRefresh = new ValidatedMethod({
	name: 'Games.getWeeksToRefresh',
	validate: new SimpleSchema({}).validator(),
	run () {
		const weeks = _.uniq(Game.find({
			status: { $ne: 'C' },
			kickoff: { $lte: new Date() }
		}, {
			sort: { week: 1 }, fields: { week: 1 }
		}).map(game => game.week), true);
		if (!weeks) throw new Meteor.Error('No weeks found to refresh!');
		return weeks;
	}
});
export const getWeeksToRefreshSync = Meteor.wrapAsync(getWeeksToRefresh.call, getWeeksToRefresh);

export const insertGame = new ValidatedMethod({
	name: 'Games.insertGame',
	validate: new SimpleSchema({
		game: { type: Object, label: 'Game Object', blackbox: true }
	}).validator(),
	run ({ game }) {
		const newGame = new Game(game);
		newGame.save();
	}
});
export const insertGameSync = Meteor.wrapAsync(insertGame.call, insertGame);

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
			validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }]
		},
		game: {
			type: Number,
			validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 0 }, { type: 'lte', param: 16 }] }]
		},
		home_id: String,
		home_short: {
			type: String,
			validators: [{ type: 'length', param: 3 }]
		},
		home_spread: {
			type: Number,
			optional: true
		},
		home_score: {
			type: Number,
			validators: [{ type: 'gte', param: 0 }]
		},
		visitor_id: String,
		visitor_short: {
			type: String,
			validators: [{ type: 'length', param: 3 }]
		},
		visitor_spread: {
			type: Number,
			optional: true
		},
		visitor_score: {
			type: Number,
			validators: [{ type: 'gte', param: 0 }]
		},
		winner_id: {
			type: String,
			optional: true
		},
		winner_short: {
			type: String,
			validators: [{ type: 'length', param: 3 }],
			optional: true
		},
		status: {
			type: String,
			validators: [{ type: 'choice', param: ['P', 'I', '1', '2', 'H', '3', '4', 'C'] }]
		},
		kickoff: Date,
		time_left: {
			type: Number,
			validators: [{ type: 'and', param: [{ type: 'gte', param: 0 }, { type: 'lte', param: 3600 }] }]
		},
		has_possession: {
			type: String,
			validators: [{ type: 'choice', param: ['H', 'V'] }],
			optional: true
		},
		in_redzone: {
			type: String,
			validators: [{ type: 'choice', param: ['H', 'V'] }],
			optional: true
		}
	},
	helpers: {
		getTeam (which) {
			let teamId;
			if (which === 'home') {
				teamId = this.home_id;
			} else if (which === 'visitor') {
				teamId = this.visitor_id;
			} else if (which === 'winner') {
				teamId = this.winner_id;
			} else {
				console.error('Incorrect type passed', which);
				return null;
			}
			return getTeamByID.call({ teamId });
		}
	},
	indexes: {
		gameOrder: {
			fields: {
				week: 1,
				game: 1
			},
			options: {
				unique: true
			}
		},
		games: {
			fields: {
				game: 1
			},
			options: {}
		},
		incompleteGames: {
			fields: {
				game: 1,
				status: 1
			},
			options: {}
		},
		gameFindAPI: {
			fields: {
				week: 1,
				home_short: 1,
				visitor_short: 1
			},
			options: {
				unique: true
			}
		}
	},
	meteorMethods: {}
});
