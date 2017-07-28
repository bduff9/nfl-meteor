'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { dbVersion } from '../constants';
import { displayError, logError } from '../global';
import { getPicksForWeek } from './picks';
import { writeLog } from './nfllogs';
import { getUserByID, getUserNameSync, sendAllPicksInEmail } from './users';

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

export const hasAllSubmitted = new ValidatedMethod({
	name: 'Tiebreakers.hasAllSubmitted',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ league, week }) {
		const users = Tiebreaker.find({ league, week }).fetch(),
				haveNotSubmitted = users.filter(user => !user.submitted);
		return haveNotSubmitted.length === 0;
	}
});
export const hasAllSubmittedSync = Meteor.wrapAsync(hasAllSubmitted.call, hasAllSubmitted);

export const migrateTiebreakersForUser = new ValidatedMethod({
	name: 'Tiebreakers.migrateTiebreakersForUser',
	validate: new SimpleSchema({
		newUserId: { type: String, label: 'New User ID' },
		oldUserId: { type: String, label: 'Old User ID' }
	}).validator(),
	run ({ newUserId, oldUserId }) {
		Tiebreaker.update({ user_id: oldUserId }, { $set: { user_id: newUserId }}, { multi: true });
	}
});
export const migrateTiebreakersForUserSync = Meteor.wrapAsync(migrateTiebreakersForUser.call, migrateTiebreakersForUser);

export const resetTiebreaker = new ValidatedMethod({
	name: 'Tiebreakers.resetTiebreaker',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ league, week }) {
		if (!this.userId) throw new Meteor.Error('Tiebreakers.resetTiebreaker.notLoggedIn', 'Must be logged in to reset tiebreaker');
		if (Meteor.isServer) {
			const tb = Tiebreaker.findOne({ league, user_id: this.userId, week });
			tb.last_score = undefined;
			tb.save();
		}
	}
});
export const resetTiebreakerSync = Meteor.wrapAsync(resetTiebreaker.call, resetTiebreaker);

export const setTiebreaker = new ValidatedMethod({
	name: 'Tiebreakers.setTiebreaker',
	validate: new SimpleSchema({
		lastScore: { type: Number, label: 'Last Score', min: 2 },
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ lastScore, league, week }) {
		const user_id = this.userId,
				tb = Tiebreaker.findOne({ league, user_id, week });
		if (!user_id) throw new Meteor.Error('Tiebreakers.setTiebreaker.notLoggedIn', 'Must be logged in to update tiebreaker');
		if (Meteor.isServer) {
			tb.last_score = lastScore;
			tb.save();
		}
	}
});
export const setTiebreakerSync = Meteor.wrapAsync(setTiebreaker.call, setTiebreaker);

export const submitPicks = new ValidatedMethod({
	name: 'Tiebreakers.submitPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ league, week }) {
		const user_id = this.userId;
		if (!user_id) throw new Meteor.Error('Tiebreakers.submitPicks.notLoggedIn', 'Must be logged in to submit picks');
		const tiebreaker = Tiebreaker.findOne({ league, user_id, week }),
				picks = getPicksForWeek.call({ league, week }),
				noPicks = picks.filter(pick => pick.week === week && !pick.hasStarted() && !pick.pick_id && !pick.pick_short && !pick.points);
		if (noPicks.length > 0) throw new Meteor.Error('Tiebreakers.submitPicks.missingPicks', 'You must complete all picks for the week before submitting');
		if (!tiebreaker.last_score) throw new Meteor.Error('Tiebreakers.submitPicks.noTiebreakerScore', 'You must submit a tiebreaker score for the last game of the week');
		if (Meteor.isServer) {
			tiebreaker.submitted = true;
			tiebreaker.save();
			sendAllPicksInEmail.call({ week }, logError);
		}
		writeLog.call({ action: 'SUBMIT_PICKS', message: `${getUserNameSync({ user_id })} has just submitted their week ${week} picks`, userId: user_id }, logError);
	}
});
export const submitPicksSync = Meteor.wrapAsync(submitPicks.call, submitPicks);

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
				const name = getUserNameSync({ user_id: this.user_id });
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
