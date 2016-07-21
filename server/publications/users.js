'use strict';

import { User } from '../../imports/api/schema';

Meteor.publish('userData', function() {
  if (!this.userId) return null;
  return User.find(this.userId, {
    fields: {
      '_id': 1,
      'services.facebook.email': 1,
      'services.google.email': 1,
      'profile': 1,
      'email': 1,
      'first_name': 1,
      'last_name': 1,
      'team_name': 1,
      'referred_by': 1,
      'verified': 1,
      'done_registering': 1,
      'paid': 1,
      'chat_hidden': 1,
      'total_points': 1,
      'total_games': 1,
      'bonus_points': 1,
      'picks': 1,
      'tiebreakers': 1,
      'survivor': 1
    }
  });
});
