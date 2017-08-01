'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { getCurrentSeasonYear } from '../imports/api/global';
import { clearGamesSync, initScheduleSync } from './collections/games';
import { clearNFLLogsSync } from './collections/nfllogs';
import { clearPicksSync } from './collections/picks';
import { clearCronHistorySync } from './scheduled-tasks';
import { clearSurvivorPicksSync } from './collections/survivorpicks';
import { getSystemValues } from '../imports/api/collections/systemvals';
import { clearTeamsSync, initTeamsSync } from './collections/teams';
import { clearTiebreakersSync } from './collections/tiebreakers';
import { getCurrentUser } from '../imports/api/collections/users';

/**
 * Before new year begins, reset all data i.e. clear out games, teams, picks, etc. and reset users back to empty
 */
export const initPoolOnServer = new ValidatedMethod({
	name: 'initPoolOnServer',
	validate: new SimpleSchema({}).validator(),
	run () {
		// Validate that current year and system vals year are different, also that current user is an admin
		const systemVals = getSystemValues.call({}),
				poolYear = systemVals.year_updated,
				currYear = getCurrentSeasonYear(),
				currUser = getCurrentUser.call({});
		if (currYear <= poolYear) throw new Meteor.Error('initPoolOnServer.invalid-years', 'Current year must be greater than the last updated year');
		if (!currUser || !currUser.is_admin) throw new Meteor.Error('initPoolOnServer.not-authorized', 'You are not authorized to do this');
		//TODO: grab overall top 3 and insert into poolhistory
		// Empty all collections we are going to refill: cronHistory, games, nfllogs, picks, survivor, teams, tiebreakers
		clearCronHistorySync({});
		clearGamesSync({});
		clearNFLLogsSync({});
		clearPicksSync({});
		clearSurvivorPicksSync({});
		clearTeamsSync({});
		clearTiebreakersSync({});
		//TODO: clear out/default old user info i.e. referred_by, done_registering, leagues, survivor, owe, paid, selected_week, total_points, total_games, overall_place, overall_tied_flag
		// When done, update lastUpdated in systemvals, then refill teams and games
		systemVals.year_updated = currYear;
		systemVals.save();
		initTeamsSync({});
		initScheduleSync({});
	}
});
