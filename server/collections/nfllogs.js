'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { TOP_WEEKLY_FOR_HISTORY } from '../../imports/api/constants';
import { formattedPlace, logError } from '../../imports/api/global';
import { NFLLog } from '../../imports/api/collections/nfllogs';
import { addPoolHistory } from '../../imports/api/collections/poolhistorys';
import { getSystemValues } from '../../imports/api/collections/systemvals';
import { getTiebreakerFromServer } from './tiebreakers';
import { getUsers } from '../../imports/api/collections/users';

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
