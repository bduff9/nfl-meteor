'use strict';

import { Team } from '../../imports/api/schema';

Meteor.publish('allTeams', function() {
  let teams;
  if (!this.userId) return null;
  teams = Team.find({});
  if (teams) return teams;
  return this.ready();
});

Meteor.publish('nflTeams', function() {
  let teams;
  if (!this.userId) return null;
  teams = Team.find({ short_name: { $nin: ['TIE', 'BON'] }});
  if (teams) return teams;
  return this.ready();
});
