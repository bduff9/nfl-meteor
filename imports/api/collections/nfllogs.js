'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { displayError, formattedPlace, logError } from '../global';
import { addPoolHistory } from '../collections/poolhistorys';
import { getSystemValues } from '../collections/systemvals';
import { getTiebreaker } from '../collections/tiebreakers';
import { getUserByID, getUsers } from '../collections/users';
import { ACTIONS, TOP_WEEKLY_FOR_HISTORY } from '../constants';


//TODO: refactor this to 1) Not reference other collections, 2) move to server as I believe its only called from the server
export const endOfWeekMessage = new ValidatedMethod({
	name: 'NFLLog.insert.endOfWeekMessage',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week' }
	}).validator(),
	run ({ week }) {
		const users = getUsers.call({ activeOnly: true }, logError);
		const MESSAGE = `Week ${week} is now over.`;
		const systemVals = getSystemValues.call({}, logError);
		const currentYear = systemVals.year_updated;
		users.forEach(user => {
			const userId = user._id;
			const leagues = user.leagues;
			leagues.forEach(league => {
				const tiebreaker = getTiebreaker.call({ week, user_id: userId, league }, logError);
				const place = tiebreaker.place_in_week;
				const message = `${MESSAGE}  You finished in ${formattedPlace(place)} place.  ${(place < 3 ? 'Congrats!' : '')}`;
				const logEntry = new NFLLog({
					action: 'MESSAGE',
					when: new Date(),
					message,
					to_id: user._id
				});
				logEntry.save();
				if (place <= TOP_WEEKLY_FOR_HISTORY) {
					const poolHistory = {
						user_id: userId,
						year: currentYear,
						league: league,
						type: 'W',
						week: week,
						place: place
					};
					addPoolHistory.call({ poolHistory }, logError);
				}
			});
		});
	}
});

export const migrateLogEntriesForUser = new ValidatedMethod({
	name: 'NFLLog.migrateLogEntriesForUser',
	validate: new SimpleSchema({
		oldUserId: { type: String, label: 'Old User ID' },
		newUserId: { type: String, label: 'New User ID' }
	}).validator(),
	run ({ oldUserId, newUserId }) {
		NFLLog.update({ user_id: oldUserId }, { $set: { user_id: newUserId }}, { multi: true });
	}
});

export const testMessage = new ValidatedMethod({
	name: 'NFLLog.testMessage',
	validate: null,
	run () {
		const logEntry = new NFLLog({
			action: 'MESSAGE',
			when: new Date(),
			message: 'Testing messaging',
			to_id: this.userId
		});
		logEntry.save();
	}
});

export const writeLog = new ValidatedMethod({
	name: 'NFLLog.insert',
	validate: new SimpleSchema({
		action: { type: String, label: 'Action', allowedValues: ACTIONS },
		message: { type: String, label: 'Message' },
		userId: { type: String, optional: true, label: 'User ID' }
	}).validator(),
	run({ action, message, userId }) {
		if (action !== '404' && !userId) throw new Meteor.Error('NFLLog.insert.not-signed-in', 'You must be logged in to write to the log');
		if (Meteor.isServer) {
			let logEntry = new NFLLog({
				action,
				when: new Date(),
				message,
				user_id: userId
			});
			logEntry.save();
		}
	}
});

/**
 * NFLLogs schema
 */
const NFLLogs = new Mongo.Collection('nfllogs');
const NFLLog = Class.create({
	name: 'NFLLog',
	collection: NFLLogs,
	secured: true,
	fields: {
		action: {
			type: String,
			validators: [{ type: 'choice', param: ACTIONS }]
		},
		when: Date,
		message: {
			type: String,
			optional: true
		},
		user_id: {
			type: String,
			optional: true
		},
		is_read: {
			type: Boolean,
			default: false
		},
		is_deleted: {
			type: Boolean,
			default: false
		},
		to_id: {
			type: String,
			optional: true
		}
	},
	helpers: {
		getUser() {
			const user = getUserByID.call({ user_id: this.user_id }, displayError);
			if (this.user_id) return user;
			return null;
		},
		getUserTo() {
			const user = getUserByID.call({ user_id: this.to_id }, displayError);
			if (this.to_id) return user;
			return null;
		}
	},
	indexes: {},
	meteorMethods: {
		toggleDeleted(markDeleted) {
			this.is_deleted = markDeleted;
			return this.save();
		},
		toggleRead(markRead) {
			this.is_read = markRead;
			return this.save();
		}
	}
});
