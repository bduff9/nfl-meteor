import { differenceInHours } from 'date-fns';

import { gamesExistSync } from '../imports/api/collections/games';
import {
	createSystemValuesSync,
	getSystemValues,
	systemValuesExistSync,
} from '../imports/api/collections/systemvals';
import { teamsExistSync } from '../imports/api/collections/teams';
import { FIRST_YEAR_FOR_SYSTEM_VALS } from '../imports/api/constants';

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
	const conns = systemVal.current_connections;
	let oldCt = 0;

	console.log('Cleaning up old connections...');

	Object.keys(conns).forEach(
		(connId: string): void => {
			const conn = conns[connId];
			const opened = new Date(conn.opened);
			const now = new Date();
			const hoursAgo = differenceInHours(now, opened);

			if (hoursAgo > 24) {
				console.log(`Connection ${connId} ${hoursAgo} hours old, deleting...`);
				delete conns[connId];
				oldCt++;
				console.log(`Connection ${connId} deleted!`);
			}
		},
	);

	if (!systemVal.year_updated) {
		// eslint-disable-next-line @typescript-eslint/camelcase
		systemVal.year_updated = FIRST_YEAR_FOR_SYSTEM_VALS;
	}

	if (systemVal.games_updating) {
		console.log('Games left as updating, fixing...');
		// eslint-disable-next-line @typescript-eslint/camelcase
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
