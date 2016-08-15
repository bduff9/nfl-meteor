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

Meteor.publish('unreadChats', function(whenHidden) {
  let unreadChats;
  if (!this.userId || !whenHidden) return this.ready();
  new SimpleSchema({
    whenHidden: { type: Date, label: 'Chat Hidden' }
  }).validate({ whenHidden });
  unreadChats = NFLLog.find({ action: 'CHAT', when: { $gt: whenHidden }}, {
    fields: {
      '_id': 1,
      'action': 1,
      'when': 1
    },
    sort: {
      when: -1
    }
  });
  if (unreadChats) return unreadChats;
  return this.ready();
});
