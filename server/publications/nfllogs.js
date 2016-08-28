'use strict';

import { NFLLog } from '../../imports/api/schema';

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

Meteor.publish('adminLogs', function(filters, limit, skip) {
  let logs;
  new SimpleSchema({
    filters: { type: Object, label: 'Filters', blackbox: true },
    limit: { type: Number, label: 'Records per Page', min: 1 },
    skip: { type: Number, label: 'Records to Skip', min: 0 }
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
