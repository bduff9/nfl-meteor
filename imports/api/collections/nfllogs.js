'use strict';

import { Meteor } from 'meteor/meteor';

import { NFLLog, User } from '../schema';
import { ACTIONS } from '../constants';
import { formattedPlace } from '../global';

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

export const toggleRead = new ValidatedMethod({
  name: 'NFLLog.update.toggleRead',
  validate: new SimpleSchema({
    msgId: { type: String, label: 'Message ID' },
    markRead: { type: Boolean, label: 'Mark Read' }
  }).validator(),
  run({ msgId, markRead }) {
    if (!this.userId) throw new Meteor.Error('NFLLog.update.toggleRead.not-signed-in', 'You must be logged in to write to the log');
    if (Meteor.isServer) {
      NFLLog.update({ _id: msgId, to_id: this.userId }, { $set: { is_read: markRead }});
    }
  }
});

export const toggleDeleted = new ValidatedMethod({
  name: 'NFLLog.update.toggleDeleted',
  validate: new SimpleSchema({
    msgId: { type: String, label: 'Message ID' },
    markDeleted: { type: Boolean, label: 'Mark Deleted' }
  }).validator(),
  run({ msgId, markDeleted }) {
    if (!this.userId) throw new Meteor.Error('NFLLog.update.toggleDeleted.not-signed-in', 'You must be logged in to write to the log');
    if (Meteor.isServer) {
      NFLLog.update({ _id: msgId, to_id: this.userId }, { $set: { is_deleted: markDeleted }});
    }
  }
});

export const testMessage = new ValidatedMethod({
  name: 'NFLLog.testMessage',
  validate: null,
  run() {
    const logEntry = new NFLLog({
      action: 'MESSAGE',
      when: new Date(),
      message: 'Testing messaging',
      to_id: this.userId
    });
    logEntry.save();
  }
});

export const endOfWeekMessage = new ValidatedMethod({
  name: 'NFLLog.insert.endOfWeekMessage',
  validate: new SimpleSchema({
    week: { type: Number, label: 'Week' }
  }).validator(),
  run({ week }) {
    const users = User.find().fetch(),
        MESSAGE = `Week ${week} is now over.`;
    let place, message, logEntry;
    users.forEach(user => {
      place = user.tiebreakers[week - 1].place_in_week;
      message = `${MESSAGE}  You finished in ${formattedPlace(place)} place`;
      logEntry = new NFLLog({
        action: 'MESSAGE',
        when: new Date(),
        message,
        to_id: user._id
      });
      logEntry.save();
    });
  }
});
