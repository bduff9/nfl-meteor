'use strict';

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { User } from '../collections/users';
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
    const users = User.find({ "done_registering": true, }).fetch(),
        MESSAGE = `Week ${week} is now over.`;
    let place, message, logEntry;
    users.forEach(user => {
      place = user.tiebreakers.filter(tiebreaker => tiebreaker.week === week)[0].place_in_week;
      message = `${MESSAGE}  You finished in ${formattedPlace(place)} place.  ${(place < 3 ? 'Congrats!' : '')}`;
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

export const NFLLogs = new Mongo.Collection('nfllogs');
export const NFLLog = Class.create({
  name: 'NFLLog',
  collection: NFLLogs,
  secured: true,
  fields: {
    action: {
      type: String,
      validators: [{ type: 'choice', param: ACTIONS }]
    },
    when: Date,
    message: {
      type: String,
      optional: true
    },
    user_id: {
      type: String,
      optional: true
    },
    is_read: {
      type: Boolean,
      default: false
    },
    is_deleted: {
      type: Boolean,
      default: false
    },
    to_id: {
      type: String,
      optional: true
    }
  },
  helpers: {
    getUser() {
      const user = User.findOne(this.user_id);
      if (this.user_id) return user;
      return null;
    },
    getUserTo() {
      const user = User.findOne(this.to_id);
      if (this.to_id) return user;
      return null;
    }
  },
  indexes: {},
  meteorMethods: {
    toggleDeleted(markDeleted) {
      this.is_deleted = markDeleted;
      return this.save();
    },
    toggleRead(markRead) {
      this.is_read = markRead;
      return this.save();
    }
  }
});
