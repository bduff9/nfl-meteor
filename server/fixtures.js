'use strict';

import { Game, Team } from '../imports/api/schema';
import { initSchedule } from '../imports/api/collections/games';
import { initTeams } from '../imports/api/collections/teams';
import { logError } from '../imports/api/global';

if (Team.find().count() === 0) {
  console.log('Begin populating teams...');
  initTeams.call(logError);
  console.log('Populating teams completed!');
}

if (Game.find().count() === 0) {
  console.log('Begin populating schedule...');
  initSchedule.call(logError);
  console.log('Populating schedule completed!');
}