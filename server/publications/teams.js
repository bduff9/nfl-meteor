'use strict';

import { Team } from '../../imports/api/schema';

Meteor.publish('allTeams', function() {
  let teams;
  if (!this.userId) return null;
  teams = Team.find({});
  if (teams) return teams;
  return this.ready();
});
