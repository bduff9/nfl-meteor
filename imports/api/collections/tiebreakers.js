'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { dbVersion } from '../../api/constants';
import { logError } from '../../api/global';
import { getLastGameOfWeek } from '../../api/collections/games';

/**
 * All tiebreaker logic
 * @since 2017-06-26
 */

// Server only?
export const addTiebreaker = new ValidatedMethod({
	name: 'Tiebreakers.addTiebreaker',
	validate: new SimpleSchema({
		tiebreaker: { type: Object, label: 'Tiebreaker' }
	}).validator(),
	run ({ tiebreaker }) {
		const newTiebreaker = new Tiebreaker(tiebreaker);
		newTiebreaker.save();
	}
});

export const getTiebreaker = new ValidatedMethod({
	name: 'Tiebreaker.getTiebreaker',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week', min: 1, max: 17 },
		league: { type: String, label: 'League' }
	}).validator(),
	run ({ league, week }) {
		const user_id = this.userId;
		const tb = Tiebreaker.findOne({ user_id, week, league });
		if (!user_id) throw new Meteor.Error('You are not signed in!');
		if (!tb) throw new Meteor.Error('No tiebreaker found');
		return tb;
	}
});

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

//const Tiebreakers = TiebreakersConditional;
const Tiebreaker = TiebreakerConditional;
