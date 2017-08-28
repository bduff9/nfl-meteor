'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { dbVersion } from '../constants';
import { getUserByID } from './users';

/**
 * All pool history logic
 * @since 2017-06-26
 */

export const addPoolHistory = new ValidatedMethod({
	name: 'PoolHistorys.addPoolHistory',
	validate: new SimpleSchema({
		poolHistory: { type: Object, label: 'Pool History', blackbox: true }
	}).validator(),
	run ({ poolHistory }) {
		const newHistory = new PoolHistory(poolHistory);
		newHistory.save();
	}
});
export const addPoolHistorySync = Meteor.wrapAsync(addPoolHistory.call, addPoolHistory);

export const getPoolHistoryForYear = new ValidatedMethod({
	name: 'PoolHistorys.getPoolHistoryForYear',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		year: { type: Number, label: 'History Year' }
	}).validator(),
	run ({ league, year }) {
		const history = PoolHistory.find({ league, year }, { sort: { type: 1, week: 1, place: 1 }}).fetch();
		if (!this.userId) throw new Meteor.Error('Not Authorized', 'You are not currently signed in.  Please sign in and then try again.');
		return history;
	}
});
export const getPoolHistoryForYearSync = Meteor.wrapAsync(getPoolHistoryForYear.call, getPoolHistoryForYear);

export const migratePoolHistorysForUser = new ValidatedMethod({
	name: 'PoolHistorys.migratePoolHistorysForUser',
	validate: new SimpleSchema({
		newUserId: { type: String, label: 'New User ID' },
		oldUserId: { type: String, label: 'Old User ID' }
	}).validator(),
	run ({ newUserId, oldUserId }) {
		PoolHistory.update({ user_id: oldUserId }, { $set: { user_id: newUserId }}, { multi: true });
	}
});
export const migratePoolHistorysForUserSync = Meteor.wrapAsync(migratePoolHistorysForUser.call, migratePoolHistorysForUser);

let PoolHistorysConditional = null;
let PoolHistoryConditional = null;

if (dbVersion > 1) {
	PoolHistorysConditional = new Mongo.Collection('poolhistory');
	PoolHistoryConditional = Class.create({
		name: 'PoolHistory',
		collection: PoolHistorysConditional,
		secured: true,
		fields: {
			user_id: String,
			year: {
				type: Number,
				validators: [{ type: 'gte', param: 2016 }], // BD: First year we started storing history
			},
			league: String,
			type: {
				type: String,
				validators: [{ type: 'choice', param: ['O', 'S', 'W'] }]
			},
			week: {
				type: Number,
				optional: true
			},
			place: {
				type: Number,
				validators: [{ type: 'gt', param: 0 }]
			}
		},
		helpers: {
			getUser () {
				return getUserByID.call({ user_id: this.user_id });
			}
		}
	});
}

//const PoolHistorys = PoolHistorysConditional;
export const PoolHistory = PoolHistoryConditional;
