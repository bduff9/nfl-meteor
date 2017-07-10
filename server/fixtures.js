'use strict';

import { moment } from 'meteor/momentjs:moment';

import { gamesExistSync } from '../imports/api/collections/games';
import { createSystemValuesSync, getSystemValuesSync, systemValuesExistSync } from '../imports/api/collections/systemvals';
import { teamsExistSync } from '../imports/api/collections/teams';
import { initScheduleSync } from './collections/games';
import { initTeamsSync } from './collections/teams';

if (!teamsExistSync()) {
	console.log('Begin populating teams...');
	initTeamsSync();
	console.log('Populating teams completed!');
}

if (!gamesExistSync()) {
	console.log('Begin populating schedule...');
	initScheduleSync();
	console.log('Populating schedule completed!');
}

if (!systemValuesExistSync()) {
	console.log('Initializing system values...');
	createSystemValuesSync();
	console.log('System values initialized!');
} else {
	const systemVal = getSystemValuesSync();
	let oldCt = 0,
			conns;
	console.log('Cleaning up old connections...');
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
