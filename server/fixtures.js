'use strict';

import { Game } from '../imports/api/collections/games';
import { SystemVal } from '../imports/api/collections/systemvals';
import { Team } from '../imports/api/collections/teams';
import { initSchedule } from '../imports/api/collections/games';
import { initTeams } from './collections/teams';
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
  let oldCt = 0,
      conns;
  console.log('Cleaning up old connections...');
  systemVal = SystemVal.findOne();
  conns = systemVal.current_connections;
  Object.keys(conns).forEach(connId => {
    let conn = conns[connId],
        opened = moment(conn.opened),
        now = moment(),
        hoursAgo = now.diff(opened, 'hours', true);
    if (hoursAgo > 24) {
      console.log(`Connection ${connId} ${hoursAgo} hours old, deleting...`);
      delete conns[connId];
      oldCt++;
      console.log(`Connection ${connId} deleted!`);
    }
  });
  systemVal.save();
  if (oldCt > 0) {
    console.log(`${oldCt} old connections cleaned!`);
  } else {
    console.log('No connections to clean!');
  }
}
