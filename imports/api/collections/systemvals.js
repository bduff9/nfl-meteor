'use strict';

import { Meteor } from 'meteor/meteor';

import { SystemVal } from '../schema';

export const toggleScoreboard = new ValidatedMethod({
  name: 'SystemVal.updateScoreboard',
  validate: new SimpleSchema({
    isOpen: { type: Boolean, label: 'Is Open' }
  }).validator(),
  run({ isOpen }) {
    if (!this.userId) throw new Meteor.Error('SystemVal.updateScoreboard.not-signed-in', 'You must be logged in to update system values');
    if (Meteor.isServer) {
      const connId = this.connection.id;
      let systemVal = SystemVal.findOne();
      systemVal.current_connections[connId].scoreboard_open = isOpen;
      systemVal.save();
    }
  }
});
