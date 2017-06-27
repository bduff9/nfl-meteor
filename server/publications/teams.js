'use strict';

import { Team } from '../../imports/api/collections/teams';

Meteor.publish('allTeams', function() {
  let teams;
  if (!this.userId) return this.ready();
  teams = Team.find({});
  if (teams) return teams;
  return this.ready();
});

Meteor.publish('nflTeams', function() {
  let teams;
  if (!this.userId) return this.ready();
  teams = Team.find({ short_name: { $nin: ['TIE', 'BON'] }});
  if (teams) return teams;
  return this.ready();
});

Meteor.publish('getTeamInfo', function(teamId) {
  let team;
  if (!this.userId) return this.ready();
  new SimpleSchema({
    teamId: { type: String, label: 'Team ID' }
  }).validate({ teamId });
  team = Team.find(teamId);
  if (team) return team;
  return this.ready();
});
