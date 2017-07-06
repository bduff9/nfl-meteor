'use strict';

import { moment } from 'meteor/momentjs:moment';

import { gamesExist } from '../imports/api/collections/games';
import { createSystemValues, getSystemValues, systemValuesExist } from '../imports/api/collections/systemvals';
import { teamsExist } from '../imports/api/collections/teams';
import { initSchedule } from './collections/games';
import { initTeams } from './collections/teams';
import { logError } from '../imports/api/global';


if (teamsExist.call({}, logError)) {
	console.log('Begin populating teams...');
	initTeams.call(logError);
	console.log('Populating teams completed!');
}

if (gamesExist.call({}, logError)) {
	console.log('Begin populating schedule...');
	initSchedule.call(logError);
	console.log('Populating schedule completed!');
}

if (systemValuesExist.call({}, logError)) {
	console.log('Initializing system values...');
	createSystemValues.call({}, logError);
	console.log('System values initialized!');
} else {
	const systemVal = getSystemValues.call({}, logError);
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
