'use strict';

import { Meteor } from 'meteor/meteor';

import { Team } from '../schema';

export const initTeams = new ValidatedMethod({
  name: 'Team.insert',
  validate: new SimpleSchema({}).validator(),
  run() {
    if (Meteor.isServer) {
      const data = Assets.getText('teams.json'),
          teams = JSON.parse(data);
      teams.forEach(teamObj => {
        let team = new Team(teamObj);
        team.save();
        console.log('Team Inserted: ', team);
      });
    }
  }
});