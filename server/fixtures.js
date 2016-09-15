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

if (SystemVal.find().count() === 0) {
  console.log('Initializing system values...');
  systemVal = new SystemVal({
    games_updating: false,
    current_connections: {}
  });
  systemVal.save();
  console.log('System values initialized!');
} else {
  let conns;
  console.log('Cleaning up old connections...');
  systemVal = SystemVal.findOne();
  conns = systemVal.current_connections;
  Object.keys(conns).forEach(connId => {
    let conn = conns[connId],
        opened = moment(conn.opened),
        now = moment(),
        hoursAgo = now.diff(opened, 'hours', true);
    if (hoursAgo > 24) delete conns[connId];
  });
  systemVal.save();
  console.log('Old connections cleaned!');
}
