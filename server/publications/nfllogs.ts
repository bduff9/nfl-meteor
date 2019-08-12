import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Counts } from 'meteor/tmeasday:publish-counts';

import { NFLLog, TNFLLog } from '../../imports/api/collections/nfllogs';
import { TNFLLogAction } from '../../imports/api/commonTypes';

Meteor.publish('allChats', function (): TNFLLog[] | void {
	let allChats;

	if (!this.userId) return this.ready();

	allChats = NFLLog.find(
		{ action: 'CHAT' },
		{
			fields: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				_id: 1,
				action: 1,
				when: 1,
				message: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				user_id: 1,
			},
			sort: {
				when: -1,
			},
		},
	);

	if (allChats) return allChats;

	return this.ready();
});

Meteor.publish('lastChatAction', function (): TNFLLog | void {
	let lastChat;

	if (!this.userId) return this.ready();

	lastChat = NFLLog.find(
		// eslint-disable-next-line @typescript-eslint/camelcase
		{ action: { $in: ['CHAT_HIDDEN', 'CHAT_OPENED'] }, user_id: this.userId },
		{
			fields: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				_id: 1,
				action: 1,
				when: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				user_id: 1,
			},
			sort: {
				when: -1,
			},
			limit: 1,
		},
	);

	if (lastChat) return lastChat;

	return this.ready();
});

Meteor.publish('unreadChats', function (lastAction: TNFLLog): TNFLLog[] | void {
	// eslint-disable-next-line @typescript-eslint/camelcase
	const filter: {
		action: TNFLLogAction;
		user_id: { [k: string]: string };
		when?: { [k: string]: Date };
		// eslint-disable-next-line @typescript-eslint/camelcase
	} = { action: 'CHAT', user_id: { $ne: this.userId } };
	let unreadChats;

	if (!this.userId) return this.ready();

	if (lastAction && lastAction.action === 'CHAT_OPENED') return this.ready();

	if (lastAction && lastAction.action === 'CHAT_HIDDEN')
		filter.when = { $gt: lastAction.when };

	unreadChats = NFLLog.find(filter, {
		fields: {
			// eslint-disable-next-line @typescript-eslint/camelcase
			_id: 1,
			action: 1,
			when: 1,
			message: 1,
			// eslint-disable-next-line @typescript-eslint/camelcase
			user_id: 1,
		},
	});

	if (unreadChats) return unreadChats;

	return this.ready();
});

Meteor.publish('allMessages', function (): TNFLLog[] | void {
	let allMessages;

	if (!this.userId) return this.ready();

	allMessages = NFLLog.find(
		// eslint-disable-next-line @typescript-eslint/camelcase
		{ action: 'MESSAGE', is_deleted: false, to_id: this.userId },
		{
			fields: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				_id: 1,
				action: 1,
				when: 1,
				message: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				user_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				to_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				is_read: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				is_deleted: 1,
			},
			sort: {
				when: -1,
			},
		},
	);

	if (allMessages) return allMessages;

	return this.ready();
});

Meteor.publish('unreadMessages', function (): TNFLLog | void {
	let messages;

	if (!this.userId) return this.ready();

	messages = NFLLog.find(
		{
			action: 'MESSAGE',
			// eslint-disable-next-line @typescript-eslint/camelcase
			is_read: false,
			// eslint-disable-next-line @typescript-eslint/camelcase
			is_deleted: false,
			// eslint-disable-next-line @typescript-eslint/camelcase
			to_id: this.userId,
		},
		{
			fields: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				_id: 1,
				action: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				to_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				is_read: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				is_deleted: 1,
			},
		},
	);

	if (messages) return messages;

	return this.ready();
});

type TNFLLogFilter = {
	action: TNFLLogAction;
	to_id: string;
	user_id: string;
};

Meteor.publish('adminLogs', function (
	filters: TNFLLogFilter,
	limit: number,
	skip: number,
): TNFLLog[] | void {
	let logs;

	new SimpleSchema({
		filters: { type: Object, label: 'Filters', blackbox: true },
		limit: { type: Number, label: 'Records per Page', min: 1 },
		skip: { type: Number, label: 'Records to Skip', min: 0 },
	}).validate({ filters, limit, skip });

	if (!this.userId) return this.ready();

	Counts.publish(this, 'adminLogsCt', NFLLog.find(filters), { noReady: true });

	logs = NFLLog.find(filters, {
		fields: {
			// eslint-disable-next-line @typescript-eslint/camelcase
			_id: 1,
			action: 1,
			when: 1,
			message: 1,
			// eslint-disable-next-line @typescript-eslint/camelcase
			user_id: 1,
			// eslint-disable-next-line @typescript-eslint/camelcase
			to_id: 1,
			// eslint-disable-next-line @typescript-eslint/camelcase
			is_read: 1,
			// eslint-disable-next-line @typescript-eslint/camelcase
			is_deleted: 1,
		},
		sort: {
			when: 1,
		},
		limit,
		skip,
	});

	if (logs) return logs;

	return this.ready();
});
