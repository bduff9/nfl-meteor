'use strict';

import { Meteor } from 'meteor/meteor';

import { NFLLog } from '../schema';
import { ACTIONS } from '../constants';

export const writeLog = new ValidatedMethod({
  name: 'NFLLog.insert',
  validate: new SimpleSchema({
    action: { type: String, label: 'Action', allowedValues: ACTIONS },
    message: { type: String, label: 'Message' },
    userId: { type: String, label: 'User ID' }
  }).validator(),
  run({ action, message, userId }) {
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