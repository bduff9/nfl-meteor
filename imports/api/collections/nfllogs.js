'use strict';

import { Meteor } from 'meteor/meteor';

import { NFLLog } from '../schema';
import { ACTIONS } from '../constants';

export const writeLog = new ValidatedMethod({
  name: 'NFLLog.insert',
  validate: new SimpleSchema({
    action: { type: String, label: 'Action', allowedValues: ACTIONS },
    message: { type: String, label: 'Message' },
    userId: { type: String, optional: true, label: 'User ID' }
  }).validator(),
  run({ action, message, userId }) {
    if (action !== '404' && !userId) throw new Meteor.Error('NFLLog.insert.not-signed-in', 'You must be logged in to write to the log');
    if (Meteor.isServer) {
      let logEntry = new NFLLog({
        action,
        when: new Date(),
        message,
        user_id: userId
      });
      logEntry.save();
    }
  }
});
