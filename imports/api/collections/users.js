'use strict';

import { Meteor } from 'meteor/meteor';

import { User } from '../schema';

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