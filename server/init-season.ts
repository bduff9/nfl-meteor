import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Meteor } from 'meteor/meteor';

import {
	addPoolHistory,
	TPoolHistory,
} from '../imports/api/collections/poolhistorys';
import {
	getSystemValues,
	TSystemVals,
	createSystemValues,
} from '../imports/api/collections/systemvals';
import {
	getCurrentUser,
	getUsers,
	resetUser,
	TUser,
} from '../imports/api/collections/users';
import { DEFAULT_LEAGUE } from '../imports/api/constants';
import { getCurrentSeasonYear } from '../imports/api/global';

import { clearGames, initSchedule } from './collections/games';
import { clearNFLLogs } from './collections/nfllogs';
import { clearPicks } from './collections/picks';
import { clearSurvivorPicks } from './collections/survivorpicks';
import { clearTeams, initTeams } from './collections/teams';
import { clearTiebreakers } from './collections/tiebreakers';
import { clearCronHistory } from './scheduled-tasks';
import { clearSystemVals } from './collections/systemvals';

/**
 * Before new year begins, reset all data i.e. clear out games, teams, picks, etc. and reset users back to empty
 */
export const initPoolOnServer = new ValidatedMethod({
	name: 'initPoolOnServer',
	validate: new SimpleSchema({}).validator(),
	run (): void {
		// Validate that current year and system vals year are different, also that current user is an admin
		const systemVals: TSystemVals = getSystemValues.call({});
		const poolYear = systemVals.year_updated;
		const currYear = getCurrentSeasonYear();
		const currUser: TUser = getCurrentUser.call({});
		const users: TUser[] = getUsers.call({ activeOnly: true });

		if (currYear <= poolYear)
			throw new Meteor.Error(
				'Invalid Year Passed',
				'Current year must be greater than the last updated year',
			);

		if (!currUser || !currUser.is_admin)
			throw new Meteor.Error(
				'Not Authorized',
				'You are not authorized to do this',
			);

		// Grab overall top 3 and insert into poolhistory
		users.forEach(
			(user): void => {
				const overallPlace = user.overall_place;

				if (overallPlace && overallPlace <= 3) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
					// @ts-ignore
					const overallHistory: TPoolHistory = {
						// eslint-disable-next-line @typescript-eslint/camelcase
						user_id: user._id,
						year: poolYear,
						league: DEFAULT_LEAGUE, // TODO: set this history per league
						type: 'O',
						place: overallPlace,
					};

					addPoolHistory.call({ poolHistory: overallHistory });
				}
			},
		);

		// Empty all collections we are going to refill: cronHistory, games, nfllogs, picks, survivor, teams, tiebreakers
		clearCronHistory.call({});
		clearGames.call({});
		clearNFLLogs.call({});
		clearPicks.call({});
		clearSurvivorPicks.call({});
		clearTeams.call({});
		clearTiebreakers.call({});

		// Clear out/default old user info i.e. referred_by, done_registering, leagues, survivor, owe, paid, selected_week, total_points, total_games, overall_place, overall_tied_flag
		users.forEach(
			({ _id: userId }): void => {
				if (userId !== currUser._id) resetUser.call({ userId });
			},
		);

		// When done, update lastUpdated in systemvals, then refill teams and games
		clearSystemVals.call({});
		createSystemValues.call({});
		initTeams.call({});
		initSchedule.call({});
		resetUser.call({ userId: currUser._id });

		console.log(`Finished updating pool from ${poolYear} to ${currYear}!`);
	},
});
