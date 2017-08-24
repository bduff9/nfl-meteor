'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { DEFAULT_LEAGUE } from '../imports/api/constants';
import { getCurrentSeasonYear } from '../imports/api/global';
import { clearGames, initSchedule } from './collections/games';
import { clearNFLLogs } from './collections/nfllogs';
import { clearPicks } from './collections/picks';
import { addPoolHistory } from '../imports/api/collections/poolhistorys';
import { clearCronHistory } from './scheduled-tasks';
import { clearSurvivorPicks } from './collections/survivorpicks';
import { getSystemValues } from '../imports/api/collections/systemvals';
import { clearTeams, initTeams } from './collections/teams';
import { clearTiebreakers } from './collections/tiebreakers';
import { getCurrentUser, getUsers } from '../imports/api/collections/users';

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
				currUser = getCurrentUser.call({}),
				users = getUsers.call({ activeOnly: false });
		if (currYear <= poolYear) throw new Meteor.Error('Invalid Year Passed', 'Current year must be greater than the last updated year');
		if (!currUser || !currUser.is_admin) throw new Meteor.Error('Not Authorized', 'You are not authorized to do this');
		// Grab overall top 3 and insert into poolhistory
		users.forEach(user => {
			const overallPlace = user.overall_place;
			const overallHistory = {
				user_id: user._id,
				year: poolYear,
				league: user.league || DEFAULT_LEAGUE,
				type: 'O'
			};
			if (overallPlace <= 3) {
				overallHistory.place = overallPlace;
				addPoolHistory.call({ poolHistory: overallHistory });
			}
		});
		// Empty all collections we are going to refill: cronHistory, games, nfllogs, picks, survivor, teams, tiebreakers
		clearCronHistory.call({});
		clearGames.call({});
		clearNFLLogs.call({});
		clearPicks.call({});
		clearSurvivorPicks.call({});
		clearTeams.call({});
		clearTiebreakers.call({});
		// Clear out/default old user info i.e. referred_by, done_registering, leagues, survivor, owe, paid, selected_week, total_points, total_games, overall_place, overall_tied_flag
		users.forEach(user => {
			user.done_registering = false;
			user.leagues = [];
			user.survivor = false;
			user.owe = 0;
			user.paid = 0;
			user.selected_week = {};
			user.total_points = 0;
			user.total_games = 0;
			user.overall_place = undefined;
			user.overall_tied_flag = false;
			user.save();
		});
		// When done, update lastUpdated in systemvals, then refill teams and games
		systemVals.year_updated = currYear;
		systemVals.save();
		initTeams.call({});
		initSchedule.call({});
	}
});
