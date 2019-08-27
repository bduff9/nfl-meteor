import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { ACTIONS } from '../constants';
import { getUserByID, TUser } from '../collections/users';
import { TNFLLogAction } from '../commonTypes';

export type TNFLLog = {
	_id: string;
	action: TNFLLogAction;
	when: Date;
	message?: string | null;
	user_id?: string | null;
	is_read: boolean;
	is_deleted: boolean;
	to_id?: string | null;
	getUser: () => TUser;
	getUserTo: () => TUser | null;
	toggleDeleted: (m: boolean, cb: any) => void;
	toggleRead: (m: boolean, cb: any) => void;
};

/**
 * NFLLogs schema
 */
const NFLLogs = new Mongo.Collection('nfllogs');
export const NFLLog = Class.create({
	name: 'NFLLog',
	collection: NFLLogs,
	secured: true,
	fields: {
		action: {
			type: String,
			validators: [{ type: 'choice', param: ACTIONS }],
		},
		when: Date,
		message: {
			type: String,
			optional: true,
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: {
			type: String,
			optional: true,
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		is_read: {
			type: Boolean,
			default: false,
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		is_deleted: {
			type: Boolean,
			default: false,
		},
		// eslint-disable-next-line @typescript-eslint/camelcase
		to_id: {
			type: String,
			optional: true,
		},
	},
	helpers: {
		getUser (): TUser | null {
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			if (!this.user_id) return null;

			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/camelcase
			return getUserByID.call({ user_id: this.user_id });
		},
		getUserTo (): TUser | null {
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			if (!this.to_id) return null;

			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/camelcase
			return getUserByID.call({ user_id: this.to_id });
		},
	},
	indexes: {},
	meteorMethods: {
		toggleDeleted (markDeleted: boolean): void {
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/camelcase
			this.is_deleted = markDeleted;

			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			return this.save();
		},
		toggleRead (markRead: boolean): void {
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			// eslint-disable-next-line @typescript-eslint/camelcase
			this.is_read = markRead;

			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			return this.save();
		},
	},
});

export const getAllMessages = new ValidatedMethod<{}>({
	name: 'NFLLogs.getAllMessages',
	validate: new SimpleSchema({}).validator(),
	run (): TNFLLog[] {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const to_id = this.userId;
		const messages = NFLLog.find(
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ action: 'MESSAGE', is_deleted: false, to_id },
			{ sort: { when: -1 } },
		).fetch();

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (!to_id) throw new Meteor.Error('You are not signed in');

		return messages;
	},
});
export const getAllMessagesSync = Meteor.wrapAsync(
	getAllMessages.call,
	getAllMessages,
);

export type TGetLogByIDProps = { logId: string };
export const getLogByID = new ValidatedMethod<TGetLogByIDProps>({
	name: 'NFLLogs.getLogByID',
	validate: new SimpleSchema({
		logId: { type: String, label: 'Log ID' },
	}).validator(),
	run ({ logId }: TGetLogByIDProps): TNFLLog {
		const log = NFLLog.findOne(logId);

		if (!this.userId) throw new Meteor.Error('You are not signed in');

		if (!log) throw new Meteor.Error('No log record found');

		return log;
	},
});
export const getLogByIDSync = Meteor.wrapAsync(getLogByID.call, getLogByID);

export type TGetLogsProps = { filters: { [k: string]: any } };
export const getLogs = new ValidatedMethod<TGetLogsProps>({
	name: 'NFLLogs.getLogs',
	validate: new SimpleSchema({
		filters: { type: Object, label: 'NFL Log Filters', blackbox: true },
	}).validator(),
	run ({ filters }: TGetLogsProps): TNFLLog[] {
		const logs = NFLLog.find(filters, { sort: { when: 1 } }).fetch();

		if (!this.userId) throw new Meteor.Error('You are not signed in');

		return logs;
	},
});
export const getLogsSync = Meteor.wrapAsync(getLogs.call, getLogs);

export const getUnreadMessages = new ValidatedMethod<{}>({
	name: 'NFLLogs.getUnreadMessages',
	validate: new SimpleSchema({}).validator(),
	run (): TNFLLog[] {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const to_id = this.userId;
		const unread = NFLLog.find({
			action: 'MESSAGE',
			// eslint-disable-next-line @typescript-eslint/camelcase
			is_read: false,
			// eslint-disable-next-line @typescript-eslint/camelcase
			is_deleted: false,
			// eslint-disable-next-line @typescript-eslint/camelcase
			to_id,
		}).fetch();

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (!to_id) throw new Meteor.Error('You are not signed in');

		return unread;
	},
});
export const getUnreadMessagesSync = Meteor.wrapAsync(
	getUnreadMessages.call,
	getUnreadMessages,
);

export type TMigrateLogEntriesForUsersProps = {
	newUserId: string;
	oldUserId: string;
};
export const migrateLogEntriesForUser = new ValidatedMethod<
	TMigrateLogEntriesForUsersProps
>({
	name: 'NFLLog.migrateLogEntriesForUser',
	validate: new SimpleSchema({
		newUserId: { type: String, label: 'New User ID' },
		oldUserId: { type: String, label: 'Old User ID' },
	}).validator(),
	run ({ newUserId, oldUserId }: TMigrateLogEntriesForUsersProps): void {
		NFLLog.update(
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ user_id: oldUserId },
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ $set: { user_id: newUserId } },
			{ multi: true },
		);
	},
});
export const migrateLogEntriesForUserSync = Meteor.wrapAsync(
	migrateLogEntriesForUser.call,
	migrateLogEntriesForUser,
);

export const testMessage = new ValidatedMethod<{}>({
	name: 'NFLLog.testMessage',
	validate: new SimpleSchema({}).validator(),
	run (): void {
		const logEntry = new NFLLog({
			action: 'MESSAGE',
			when: new Date(),
			message: 'Testing messaging',
			// eslint-disable-next-line @typescript-eslint/camelcase
			to_id: this.userId,
		});

		logEntry.save();
	},
});
export const testMessageSync = Meteor.wrapAsync(testMessage.call, testMessage);

export type TWriteLogProps = {
	action: TNFLLogAction;
	message: string;
	userId?: string;
};
export const writeLog = new ValidatedMethod<TWriteLogProps>({
	name: 'NFLLog.insert',
	validate: new SimpleSchema({
		action: { type: String, label: 'Action', allowedValues: ACTIONS },
		message: { type: String, label: 'Message' },
		userId: { type: String, optional: true, label: 'User ID' },
	}).validator(),
	run ({ action, message, userId }: TWriteLogProps): void {
		if (action !== '404' && !userId)
			throw new Meteor.Error(
				'NFLLog.insert.not-signed-in',
				'You must be logged in to write to the log',
			);

		if (Meteor.isServer) {
			const logEntry = new NFLLog({
				action,
				when: new Date(),
				message,
				// eslint-disable-next-line @typescript-eslint/camelcase
				user_id: userId,
			});

			logEntry.save();
		}
	},
});
export const writeLogSync = Meteor.wrapAsync(writeLog.call, writeLog);
