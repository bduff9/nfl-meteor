'use strict';

import { Meteor } from 'meteor/meteor';

import { Team } from '../schema';

export const initTeams = new ValidatedMethod({
  name: 'Team.insert',
  validate: new SimpleSchema({}).validator(),
  run() {
    if (Meteor.isServer) {
      const url = 'http://www.barcodegames.com/Teams';
      let response = HTTP.get(url, {}),
          leaguesObj = xml2js.parseStringSync(response.content, { explicitArray: false});
      console.log('team XML', leaguesObj.LeagueFormats.LeagueFormat[0].Conferences.Conference);
    }
  }
});