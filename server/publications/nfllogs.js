'use strict';

import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Counts } from 'meteor/tmeasday:publish-counts';

import { NFLLog } from '../../imports/api/collections/nfllogs';

Meteor.publish('allChats', function () {
	let allChats;

	if (!this.userId) return this.ready();

	allChats = NFLLog.find({ action: 'CHAT' }, {
		fields: {
			'_id': 1,
			'action': 1,
			'when': 1,
			'message': 1,
			'user_id': 1,
		},
		sort: {
			when: -1,
		},
	});

	if (allChats) return allChats;

	return this.ready();
});

Meteor.publish('lastChatAction', function () {
	let lastChat;

	if (!this.userId) return this.ready();

	lastChat = NFLLog.find({ action: { $in: ['CHAT_HIDDEN', 'CHAT_OPENED']}, user_id: this.userId }, {
		fields: {
			'_id': 1,
			'action': 1,
			'when': 1,
			'user_id': 1,
		},
		sort: {
			when: -1,
		},
		limit: 1,
	});

	if (lastChat) return lastChat;

	return this.ready();
});

Meteor.publish('unreadChats', function (lastAction) {
	const filter = { action: 'CHAT', user_id: { $ne: this.userId }};
	let unreadChats;

	if (!this.userId) return this.ready();

	if (lastAction && lastAction.action === 'CHAT_OPENED') return this.ready();

	if (lastAction && lastAction.action === 'CHAT_HIDDEN') filter.when = { $gt: lastAction.when };

	unreadChats = NFLLog.find(filter, {
		fields: {
			'_id': 1,
			'action': 1,
			'when': 1,
			'message': 1,
			'user_id': 1,
		},
	});

	if (unreadChats) return unreadChats;

	return this.ready();
});

Meteor.publish('allMessages', function () {
	let allMessages;

	if (!this.userId) return this.ready();

	allMessages = NFLLog.find({ action: 'MESSAGE', is_deleted: false, to_id: this.userId }, {
		fields: {
			'_id': 1,
			'action': 1,
			'when': 1,
			'message': 1,
			'user_id': 1,
			'to_id': 1,
			'is_read': 1,
			'is_deleted': 1,
		},
		sort: {
			when: -1,
		},
	});

	if (allMessages) return allMessages;

	return this.ready();
});

Meteor.publish('unreadMessages', function () {
	let messages;

	if (!this.userId) return this.ready();

	messages = NFLLog.find({ action: 'MESSAGE', is_read: false, is_deleted: false, to_id: this.userId }, {
		fields: {
			'_id': 1,
			'action': 1,
			'to_id': 1,
			'is_read': 1,
			'is_deleted': 1,
		},
	});

	if (messages) return messages;

	return this.ready();
});

Meteor.publish('adminLogs', function (filters, limit, skip) {
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
			'_id': 1,
			'action': 1,
			'when': 1,
			'message': 1,
			'user_id': 1,
			'to_id': 1,
			'is_read': 1,
			'is_deleted': 1,
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
