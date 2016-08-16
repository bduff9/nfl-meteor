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
            'when': 1
          },
          sort: {
            when: -1
          }
        });
      }
    }
  ]
});
