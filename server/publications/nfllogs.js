'use strict';

import { NFLLog, NFLLogs } from '../../imports/api/schema';

Meteor.publish('allChats', function() {
  let allChats;
  if (!this.userId) return this.ready();
  allChats = NFLLog.find({ action: 'CHAT' }, {
    fields: {
      '_id': 1,
      'action': 1,
      'when': 1,
      'message': 1,
      'user_id': 1
    },
    sort: {
      when: -1
    }
  });
  if (allChats) return allChats;
  return this.ready();
});

Meteor.publishComposite('unreadChats', {
  find: function() {
    return NFLLog.find({ action: { $in: ['CHAT_HIDDEN', 'CHAT_OPENED']}, user_id: this.userId }, {
      fields: {
        '_id': 1,
        'action': 1,
        'when': 1,
        'user_id': 1
      },
      sort: {
        when: -1
      },
      limit: 1
    });
  },
  children: [
    {
      find: function(lastAction) {
        return NFLLog.find({ action: 'CHAT', when: { $gt: lastAction.when }}, {
          fields: {
            '_id': 1,
            'action': 1,
            'when': 1,
            'message': 1,
            'user_id': 1
          },
          sort: {
            when: -1
          }
        });
      }
    }
  ]
});

Meteor.publish('allMessages', function() {
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
      'is_deleted': 1
    },
    sort: {
      when: -1
    }
  });
  if (allMessages) return allMessages;
  return this.ready();
});

Meteor.publish('unreadMessages', function() {
  let messages;
  if (!this.userId) return this.ready();
  messages = NFLLog.find({ action: 'MESSAGE', is_read: false, is_deleted: false, to_id: this.userId }, {
    fields: {
      '_id': 1,
      'action': 1,
      'to_id': 1,
      'is_read': 1,
      'is_deleted': 1
    }
  });
  if (messages) return messages;
  return this.ready();
});

Meteor.publish('adminLogs', function(limit, skip, actions, userFroms, userTos) {
  let filters = {},
      logs;
  new SimpleSchema({
    limit: { type: Number, label: 'Records per Page', min: 1 },
    skip: { type: Number, label: 'Records to Skip', min: 0 },
    actions: { type: [String], label: 'Actions List', optional: true },
    userFroms: { type: [String], label: 'User List', optional: true },
    userTos: { type: [String], label: 'User To List', optional: true }
  }).validate({ limit, skip, actions, userFroms, userTos });
  if (!this.userId) return this.ready();
  if (actions) filters.action = { $in: actions };
  if (userFroms) filters.user_id = { $in: userFroms };
  if (userTos) filters.to_id = { $in: userTos };
console.log(filters);

  Counts.publish(this, 'adminLogsCt', NFLLogs.find(filters), { noReady: true });
  logs = NFLLogs.find(filters, {
    fields: {
      '_id': 1,
      'action': 1,
      'when': 1,
      'message': 1,
      'user_id': 1,
      'to_id': 1,
      'is_read': 1,
      'is_deleted': 1
    },
    sort: {
      when: 1
    },
    limit,
    skip
  });
  if (logs) return logs;
  return this.ready();
});
