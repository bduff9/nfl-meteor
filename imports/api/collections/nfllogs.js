'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { displayError } from '../global';
import { getUserByID } from '../collections/users';
import { ACTIONS } from '../constants';

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
