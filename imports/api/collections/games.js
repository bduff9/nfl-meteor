'use strict';

import { Meteor } from 'meteor/meteor';

import { Game } from '../schema';

export const initSchedule = new ValidatedMethod({
  name: 'Game.insert',
  validate: new SimpleSchema({}).validator(),
  run() {
    if (Meteor.isServer) {
      const currYear = new Date().getFullYear(),
          weeks = 17,
          data = { TYPE: 'nflSchedule', JSON: 1 },
          url = `http://www03.myfantasyleague.com/${currYear}/export`;
      let response;
      for (let w = 1; w <= weeks; w++) {
        data.W = w;
        response = HTTP.get(url, { params: data });
        console.log('Week ' + w + ': ' + response.data.nflSchedule.matchup.length + ' games');
      }
    }
  }
});