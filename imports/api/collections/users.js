'use strict';

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { User } from '../collections';

if (Meteor.isServer) {
  Meteor.publish('userData', function() {
    if (!this.userId) return null;
    return Meteor.users.find(this.userId, {
      fields: {
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
}

export const updateUser = new ValidatedMethod({
  name: 'User.update',
  validate: new SimpleSchema({
    done_registering: { type: Boolean, allowedValues: [true] },
    first_name: { type: String, label: 'First Name' },
    last_name: { type: String, label: 'Last Name' },
    referred_by: { type: String, label: 'Referred By' },
    team_name: { type: String, label: 'Team Name' }
  }).validator(),
  run(userObj) {
    if (!this.userId) throw new Meteor.Error('User.update.notLoggedIn', 'Must be logged in to change profile');
    User.update(this.userId, { $set: userObj });
  }
});