'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { dbVersion } from '../../api/constants';
import { displayError } from '../../api/global';
import { gameHasStarted } from './games';
import { getTeamByID } from './teams';

/**
 * All survivor logic
 * @since 2017-06-26
 */

export const getAllSurvivorPicks = new ValidatedMethod({
	name: 'SurvivorPicks.getAllSurvivorPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ league, week }) {
		const picks = SurvivorPick.find({ league, week: { $lte: week }}, { sort: { user_id: 1, week: 1 }}).fetch();
		if (!this.userId) throw new Meteor.Error('You are not signed in');
		return picks;
	}
});
export const getAllSurvivorPicksSync = Meteor.wrapAsync(getAllSurvivorPicks.call, getAllSurvivorPicks);

export const getMySurvivorPicks = new ValidatedMethod({
	name: 'SurvivorPicks.getMySurvivorPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' }
	}).validator(),
	run ({ league }) {
		const user_id = this.userId,
				picks = SurvivorPick.find({ league, user_id }, { sort: { week: 1 } }).fetch();
		if (!user_id) throw new Meteor.Error('You are not signed in');
		return picks;
	}
});
export const getMySurvivorPicksSync = Meteor.wrapAsync(getMySurvivorPicks.call, getMySurvivorPicks);

export const getWeekSurvivorPicks = new ValidatedMethod({
	name: 'SurvivorPicks.getWeekSurvivorPicks',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ league, week }) {
		const picks = SurvivorPick.find({ league, week }, { sort: { user_id: 1 }}).fetch();
		if (!this.userId) throw new Meteor.Error('You are not signed in');
		return picks;
	}
});
export const getWeekSurvivorPicksSync = Meteor.wrapAsync(getWeekSurvivorPicks.call, getWeekSurvivorPicks);

export const migrateSurvivorPicksForUser = new ValidatedMethod({
	name: 'SurvivorPicks.migrateSurvivorPicksForUser',
	validate: new SimpleSchema({
		newUserId: { type: String, label: 'New User ID' },
		oldUserId: { type: String, label: 'Old User ID' }
	}).validator(),
	run ({ newUserId, oldUserId }) {
		SurvivorPick.update({ user_id: oldUserId }, { $set: { user_id: newUserId }}, { multi: true });
	}
});
export const migrateSurvivorPicksForUserSync = Meteor.wrapAsync(migrateSurvivorPicksForUser.call, migrateSurvivorPicksForUser);

let SurvivorPicksConditional = null;
let SurvivorPickConditional = null;

if (dbVersion < 2) {
	SurvivorPickConditional = Class.create({
		name: 'SurvivorPick',
		secured: true,
		fields: {
			week: {
				type: Number,
				validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }]
			},
			game_id: {
				type: String,
				optional: true
			},
			pick_id: {
				type: String,
				optional: true
			},
			pick_short: {
				type: String,
				validators: [{ type: 'length', param: 3 }],
				optional: true
			},
			winner_id: {
				type: String,
				optional: true
			},
			winner_short: {
				type: String,
				validators: [{ type: 'length', param: 3 }],
				optional: true
			}
		},
		helpers: {
			getTeam () {
				const team = getTeamByID.call({ teamId: this.pick_id }, displayError);
				return team;
			},
			hasStarted () {
				return gameHasStarted.call({ gameId: this.game_id }, displayError);
			}
		}
	});
} else {
	SurvivorPicksConditional = new Mongo.Collection('survivor');
	SurvivorPickConditional = Class.create({
		name: 'SurvivorPick',
		collection: SurvivorPicksConditional,
		secured: true,
		fields: {
			user_id: String,
			league: String,
			week: {
				type: Number,
				validators: [{ type: 'and', param: [{ type: 'required' }, { type: 'gte', param: 1 }, { type: 'lte', param: 17 }] }]
			},
			game_id: {
				type: String,
				optional: true
			},
			pick_id: {
				type: String,
				optional: true
			},
			pick_short: {
				type: String,
				validators: [{ type: 'length', param: 3 }],
				optional: true
			},
			winner_id: {
				type: String,
				optional: true
			},
			winner_short: {
				type: String,
				validators: [{ type: 'length', param: 3 }],
				optional: true
			}
		},
		helpers: {
			getTeam () {
				const team = getTeamByID.call({ teamId: this.pick_id }, displayError);
				return team;
			},
			hasStarted () {
				return gameHasStarted.call({ gameId: this.game_id }, displayError);
			}
		},
		indexes: {
			onePick: {
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

export const SurvivorPick = SurvivorPickConditional;
