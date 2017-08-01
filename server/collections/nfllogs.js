'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { SURVIVOR_WINNERS, TOP_SURVIVOR_FOR_HISTORY, TOP_WEEKLY_FOR_HISTORY } from '../../imports/api/constants';
import { formattedPlace, logError } from '../../imports/api/global';
import { NFLLog } from '../../imports/api/collections/nfllogs';
import { addPoolHistory } from '../../imports/api/collections/poolhistorys';
import { getSortedSurvivorPicksSync } from '../../imports/api/collections/survivorpicks';
import { getSystemValues } from '../../imports/api/collections/systemvals';
import { getTiebreakerFromServer } from './tiebreakers';
import { getUsers } from '../../imports/api/collections/users';

export const clearNFLLogs = new ValidatedMethod({
	name: 'NFLLogs.clearNFLLogs',
	validate: new SimpleSchema({}).validator(),
	run () {
		NFLLog.remove({}, { multi: true });
	}
});
export const clearNFLLogsSync = Meteor.wrapAsync(clearNFLLogs.call, clearNFLLogs);

export const endOfSurvivorMessage = new ValidatedMethod({
	name: 'NFLLogs.endOfSurvivorMessage',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' }
	}).validator(),
	run ({ league }) {
		const users = getSortedSurvivorPicksSync({ league });
		const MESSAGE = 'The survivor pool is now over.';
		const systemVals = getSystemValues.call({}, logError);
		const currentYear = systemVals.year_updated;
		users.forEach(user => {
			const user_id = user._id;
			const place = user.place;
			const tied = user.tied;
			const message = `${MESSAGE}  You finished ${tied ? 'tied for' : 'in'} ${formattedPlace(place)} place.  ${(place <= SURVIVOR_WINNERS ? 'Congrats!' : '')}`;
			const logEntry = new NFLLog({
				action: 'MESSAGE',
				when: new Date(),
				message,
				to_id: user_id
			});
			logEntry.save();
			if (place <= TOP_SURVIVOR_FOR_HISTORY) {
				const poolHistory = {
					user_id,
					year: currentYear,
					league,
					type: 'S',
					place
				};
				addPoolHistory.call({ poolHistory }, logError);
			}
		});
	}
});
export const endOfSurvivorMessageSync = Meteor.wrapAsync(endOfSurvivorMessage.call, endOfSurvivorMessage);

export const endOfWeekMessage = new ValidatedMethod({
	name: 'NFLLog.insert.endOfWeekMessage',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week' }
	}).validator(),
	run ({ week }) {
		const users = getUsers.call({ activeOnly: true }, logError);
		const MESSAGE = `Week ${week} is now over.`;
		const systemVals = getSystemValues.call({}, logError);
		const currentYear = systemVals.year_updated;
		users.forEach(user => {
			const user_id = user._id;
			const leagues = user.leagues;
			leagues.forEach(league => {
				const tiebreaker = getTiebreakerFromServer.call({ league, user_id, week }, logError);
				const place = tiebreaker.place_in_week;
				const message = `${MESSAGE}  You finished in ${formattedPlace(place)} place.  ${(place < 3 ? 'Congrats!' : '')}`;
				const logEntry = new NFLLog({
					action: 'MESSAGE',
					when: new Date(),
					message,
					to_id: user_id
				});
				logEntry.save();
				if (place <= TOP_WEEKLY_FOR_HISTORY) {
					const poolHistory = {
						user_id,
						year: currentYear,
						league,
						type: 'W',
						week,
						place
					};
					addPoolHistory.call({ poolHistory }, logError);
				}
			});
		});
	}
});
export const endOfWeekMessageSync = Meteor.wrapAsync(endOfWeekMessage.call, endOfWeekMessage);
