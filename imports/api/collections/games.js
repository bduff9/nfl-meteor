/* globals _ */
'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { displayError } from '../global';
import { getTeamByID, getTeamByShort } from './teams';

/**
 * All game collection logic
 */

export const currentWeek = new ValidatedMethod({
	name: 'Game.getCurrentWeek',
	validate: null,
	run () {
		const MIN_WEEK = 1,
				MAX_WEEK = 17;
		let currTime = Math.round(new Date().getTime() / 1000),
				nextGame, currWeek, startOfNextWeek;
		nextGame = Game.find({ status: { $ne: 'C' }, game: { $ne: 0 }}, { sort: { kickoff: 1 }}).fetch()[0];
		if (!nextGame) {
			currWeek = MAX_WEEK;
		} else if (nextGame.game === 1) {
			startOfNextWeek = Math.round(nextGame.kickoff.getTime() / 1000) - (24 * 3600);
			currWeek = currTime >= startOfNextWeek ? nextGame.week : nextGame.week - 1;
		} else {
			currWeek = nextGame.week;
		}
		if (currWeek < MIN_WEEK) return MIN_WEEK;
		if (currWeek > MAX_WEEK) return MAX_WEEK;
		return currWeek;
	}
});

export const findGame = new ValidatedMethod({
	name: '',
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

export const gamesExist = new ValidatedMethod({
	name: 'Games.gamesExist',
	validate: null,
	run () {
		return (Game.find().count() === 0);
	}
});

export const getEmptyUserPicks = new ValidatedMethod({
	name: 'Game.getEmptyUserPicks',
	validate: null,
	run () {
		return Game.find({}, { sort: { week: 1, game: 1 }}).map(game => {
			let bonusTeam = getTeamByShort.call({ short_name: 'BON' }, displayError);
			return {
				'week': game.week,
				'game_id': game._id,
				'game': game.game,
				'pick_id': (game.game === 0 ? bonusTeam._id : undefined),
				'pick_short': (game.game === 0 ? bonusTeam.short_name : undefined)
			};
		});
	}
});

export const getEmptyUserSurvivorPicks = new ValidatedMethod({
	name: 'Game.getEmptyUserSurvivorPicks',
	validate: null,
	run () {
		return Game.find({ game: 1 }, { sort: { week: 1 }}).map(game => {
			return {
				'week': game.week
			};
		});
	}
});

export const getEmptyUserTiebreakers = new ValidatedMethod({
	name: 'Game.getEmoptyUserTiebreakers',
	validate: null,
	run () {
		return Game.find({ game: 1 }, { sort: { week: 1 }}).map(game => {
			return {
				'week': game.week
			};
		});
	}
});

export const getFirstGameOfWeek = new ValidatedMethod({
	name: 'Game.getFirstGameOfWeek',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ week }) {
		const firstGame = Game.findOne({ week, game: 1 });
		if (firstGame) return firstGame;
		throw new Meteor.Error(`No game 1 found for week ${week}`);
	}
});

export const getLastGameOfWeek = new ValidatedMethod({
	name: '',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ week }) {
		const game = Game.findOne({ week }, { sort: { game: -1 }});
		if (!game) throw new Meteor.Error(`No games found for week ${week}`);
		return game;
	}
});

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

export const getPaymentDue = new ValidatedMethod({
	name: 'Game.getPaymentDue',
	validate: null,
	run() {
		let week3Games;
		week3Games = Game.find({ week: 3 }, { sort: { game: -1 }, limit: 1 }).fetch();
		return week3Games[0].kickoff;
	}
});

export const getWeeksToRefresh = new ValidatedMethod({
	name: 'Games.getWeeksToRefresh',
	validate: null,
	run () {
		const weeks = _.uniq(Game.find({
			game: { $ne: 0 },
			status: { $ne: 'C' },
			kickoff: { $lte: new Date() }
		}, {
			sort: { week: 1 }, fields: { week: 1 }
		}).map(game => game.week), true);
		if (!weeks) throw new Meteor.Error('No weeks found to refresh!');
		return weeks;
	}
});

export const insertGame = new ValidatedMethod({
	name: 'Games.insertGame',
	validate: new SimpleSchema({
		game: { type: Object, label: 'Game Object' }
	}).validator(),
	run ({ game }) {
		const newGame = new Game(game);
		newGame.save();
	}
});

/**
 * Game schema
 */
const Games = new Mongo.Collection('games');
const Game = Class.create({
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
		getTeam(which) {
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
			return getTeamByID.call({ teamId }, displayError);
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
