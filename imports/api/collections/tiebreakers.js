'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { dbVersion } from '../constants';
import { displayError } from '../global';
import { getUserByID, getUserName } from './users';

/**
 * All tiebreaker logic
 * @since 2017-06-26
 */

export const getAllTiebreakersForWeek = new ValidatedMethod({
	name: 'Tiebreakers.getAllTiebreakersForWeek',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		overrideSort: { type: Object, label: 'Sort', optional: true, blackbox: true },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ league, overrideSort, week }) {
		const user_id = this.userId,
				sort = overrideSort || { points_earned: -1, games_correct: -1 },
				tbs = Tiebreaker.find({ league, week }, { sort }).fetch();
		if (!user_id) throw new Meteor.Error('You are not signed in!');
		if (!tbs) throw new Meteor.Error(`No tiebreakers found for week ${week}`);
		return tbs;
	}
});
export const getAllTiebreakersForWeekSync = Meteor.wrapAsync(getAllTiebreakersForWeek.call, getAllTiebreakersForWeek);

export const getTiebreaker = new ValidatedMethod({
	name: 'Tiebreaker.getTiebreaker',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ league, week }) {
		const user_id = this.userId;
		const tb = Tiebreaker.findOne({ league, user_id, week });
		if (!user_id) throw new Meteor.Error('You are not signed in!');
		if (!tb) throw new Meteor.Error('No tiebreaker found');
		return tb;
	}
});
export const getTiebreakerSync = Meteor.wrapAsync(getTiebreaker.call, getTiebreaker);

let TiebreakersConditional = null;
let TiebreakerConditional = null;

if (dbVersion < 2) {
	TiebreakerConditional = Class.create({
		name: 'Tiebreaker',
		secured: true,
		fields: {
			week: {
				type: Number,
				validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }]
			},
			last_score: {
				type: Number,
				validators: [{ type: 'gt', param: 0 }],
				optional: true
			},
			submitted: {
				type: Boolean,
				default: false
			},
			last_score_act: {
				type: Number,
				validators: [{ type: 'gte', param: 0 }],
				optional: true
			},
			points_earned: {
				type: Number,
				default: 0
			},
			games_correct: {
				type: Number,
				default: 0
			},
			place_in_week: {
				type: Number,
				validators: [{ type: 'gt', param: 0 }],
				optional: true
			},
			tied_flag: {
				type: Boolean,
				default: false
			}
		}
	});
} else {
	TiebreakersConditional = new Mongo.Collection('tiebreakers');
	TiebreakerConditional = Class.create({
		name: 'Tiebreaker',
		collection: TiebreakersConditional,
		secured: true,
		fields: {
			user_id: String,
			league: {
				type: String,
				default: 'public'
			},
			week: {
				type: Number,
				validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }]
			},
			last_score: {
				type: Number,
				validators: [{ type: 'gt', param: 0 }],
				optional: true
			},
			submitted: {
				type: Boolean,
				default: false
			},
			last_score_act: {
				type: Number,
				validators: [{ type: 'gte', param: 0 }],
				optional: true
			},
			points_earned: {
				type: Number,
				default: 0
			},
			games_correct: {
				type: Number,
				default: 0
			},
			place_in_week: {
				type: Number,
				validators: [{ type: 'gt', param: 0 }],
				optional: true
			},
			tied_flag: {
				type: Boolean,
				default: false
			}
		},
		helpers: {
			getFullName () {
				const name = getUserName.call({ user_id: this.user_id }, displayError);
				return name;
			},
			getUser () {
				const user = getUserByID.call({ user_id: this.user_id }, displayError);
				return user;
			}
		},
		indexes: {
			oneWeek: {
				fields: {
					user_id: 1,
					league: 1,
					week: 1
				},
				options: {
					unique: true
				}
			}
		}
	});
}

export const Tiebreaker = TiebreakerConditional;
