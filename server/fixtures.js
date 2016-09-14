'use strict';

import { Game, SystemVal, Team } from '../imports/api/schema';
import { initSchedule } from '../imports/api/collections/games';
import { initTeams } from '../imports/api/collections/teams';
import { logError } from '../imports/api/global';

let systemVal;

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

console.log('Initializing system values...');
if (SystemVal.find().count() === 0) {
  systemVal = new SystemVal({
    games_updating: false,
    current_connections: {}
  });
  systemVal.save();
} else {
  systemVal = SystemVal.findOne();
  systemVal.current_connections = {};
  systemVal.save();
}
console.log('System values initialized!');
