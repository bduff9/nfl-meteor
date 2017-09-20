'use strict';

import { moment } from 'meteor/momentjs:moment';

import { FIRST_YEAR_FOR_SYSTEM_VALS } from '../imports/api/constants';
import { gamesExistSync } from '../imports/api/collections/games';
import { createSystemValuesSync, getSystemValues, systemValuesExistSync } from '../imports/api/collections/systemvals';
import { teamsExistSync } from '../imports/api/collections/teams';
import { initScheduleSync } from './collections/games';
import { initTeamsSync } from './collections/teams';

//TODO: remove manual code after it is run
import { Pick } from '../imports/api/collections/picks';
import { addPick } from './collections/picks';
import { getTiebreakerFromServer } from './collections/tiebreakers';
import { User } from '../imports/api/collections/users';
import { getLowestScore } from './collections/users';
const brett = User.findOne({ first_name: 'Brett', last_name: 'Verplank' }),
		kyle = User.findOne({ first_name: 'Kyle', last_name: 'Samp' }),
		lowestUser = getLowestScore.call({ current_user_ids: [brett._id, kyle._id], league: brett.leagues[0], week: 2 });
const lowestUserPicks = Pick.find({ user_id: lowestUser._id, week: 1 }).fetch();
Pick.remove({ week: 1, user_id: brett._id });
Pick.remove({ week: 1, user_id: kyle._id });
lowestUserPicks.forEach(pick => {
	const { week, league, game_id, game, pick_id, pick_short, points, winner_id, winner_short } = pick;
	let pickToAdd = {
		user_id: brett._id,
		week,
		league,
		game_id,
		game,
		pick_id,
		pick_short,
		points,
		winner_id,
		winner_short
	};
	addPick.call({ pick: pickToAdd });
	pickToAdd.user_id = kyle._id;
	addPick.call({ pick: pickToAdd });
	const lowestTB = getTiebreakerFromServer.call({ league, user_id: lowestUser._id, week: 1 }),
			{ last_score, last_score_act, points_earned, games_correct, place_in_week } = lowestTB;
	let userTB = getTiebreakerFromServer.call({ league, user_id: brett._id, week: pick.week });
	lowestTB.tied_flag = true;
	lowestTB.save();
	userTB.last_score = last_score;
	userTB.last_score_act = last_score_act;
	userTB.points_earned = points_earned;
	userTB.games_correct = games_correct;
	userTB.place_in_week = place_in_week;
	userTB.tied_flag = true;
	userTB.submitted = true;
	userTB.save();
	userTB = getTiebreakerFromServer.call({ league, user_id: kyle._id, week: pick.week });
	userTB.last_score = last_score;
	userTB.last_score_act = last_score_act;
	userTB.points_earned = points_earned;
	userTB.games_correct = games_correct;
	userTB.place_in_week = place_in_week;
	userTB.tied_flag = true;
	userTB.submitted = true;
	userTB.save();
});
//TODO: end section to remove

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
