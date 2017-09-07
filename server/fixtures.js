'use strict';

import { moment } from 'meteor/momentjs:moment';

import { FIRST_YEAR_FOR_SYSTEM_VALS } from '../imports/api/constants';
import { gamesExistSync } from '../imports/api/collections/games';
import { createSystemValuesSync, getSystemValues, systemValuesExistSync } from '../imports/api/collections/systemvals';
import { teamsExistSync } from '../imports/api/collections/teams';
import { initScheduleSync } from './collections/games';
import { initTeamsSync } from './collections/teams';

if (!teamsExistSync()) {
	console.log('Begin populating teams...');
	initTeamsSync();
	console.log('Populating teams completed!');
}

if (!systemValuesExistSync()) {
	console.log('Initializing system values...');
	createSystemValuesSync();
	console.log('System values initialized!');
} else {
	const systemVal = getSystemValues.call({});
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
	if (!systemVal.year_updated) systemVal.year_updated = FIRST_YEAR_FOR_SYSTEM_VALS;
	if (systemVal.games_updating) {
		console.log('Games left as updating, fixing...');
		systemVal.games_updating = false;
		console.log('Games set to not currently updating!');
	}
	systemVal.save();
	if (oldCt > 0) {
		console.log(`${oldCt} old connections cleaned!`);
	} else {
		console.log('No connections to clean!');
	}
}

if (!gamesExistSync()) {
	console.log('Begin populating schedule...');
	initScheduleSync();
	console.log('Populating schedule completed!');
}

//TODO: remove this, one run only to resolve MIA-TB game move due to hurricane
console.log('Starting hurricane fixer...');

import { Pick } from '../imports/api/collections/picks';

const badPicks = Pick.find({ week: 1, points: 16 }).fetch();

badPicks.forEach(user => {
	const { user_id }= user,
			picks = Pick.find({ week: 1, user_id }, { sort: { points: -1 }}).fetch();
	let currVal = 16;
	picks.forEach(pick => {
		if (!currVal) return;
		if (pick.points !== currVal) {
			currVal = false;
			return;
		}
		currVal--;
		pick.points = currVal;
		pick.save();
	});
});

console.log('Finished hurricane fixer!');
