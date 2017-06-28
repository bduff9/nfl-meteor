'use strict';

import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';

import { Team } from '../collections/teams';

/**
 * All game collection logic
 */

export const currentWeek = new ValidatedMethod({
	name: 'Game.getCurrentWeek',
	validate: null,
	run() {
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

export const getPaymentDue = new ValidatedMethod({
	name: 'Game.getPaymentDue',
	validate: null,
	run() {
		let week3Games;
		week3Games = Game.find({ week: 3 }, { sort: { game: -1 }, limit: 1 }).fetch();
		return week3Games[0].kickoff;
	}
});

/**
 * Game schema
 */
export const Games = new Mongo.Collection('games');
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
		getTeam(which) {
			let team;
			if (which === 'home') {
				team = Team.findOne(this.home_id);
			} else if (which === 'visitor') {
				team = Team.findOne(this.visitor_id);
			} else if (which === 'winner') {
				team = Team.findOne(this.winner_id);
			} else {
				console.error('Incorrect type passed', which);
				return null;
			}
			return team;
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
