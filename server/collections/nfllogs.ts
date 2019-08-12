import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Meteor } from 'meteor/meteor';

import { NFLLog } from '../../imports/api/collections/nfllogs';
import { addPoolHistory } from '../../imports/api/collections/poolhistorys';
import {
	getSortedSurvivorPicksSync,
	TSurvivorPick,
	TSortedSurvivor,
} from '../../imports/api/collections/survivorpicks';
import { getSystemValues } from '../../imports/api/collections/systemvals';
import { getUsers, TUser } from '../../imports/api/collections/users';
import {
	TOP_SURVIVOR_FOR_HISTORY,
	TOP_WEEKLY_FOR_HISTORY,
} from '../../imports/api/constants';
import { formattedPlace, handleError } from '../../imports/api/global';
import { TWeek } from '../../imports/api/commonTypes';

import { getTiebreakerFromServer } from './tiebreakers';

export const clearNFLLogs = new ValidatedMethod({
	name: 'NFLLogs.clearNFLLogs',
	validate: new SimpleSchema({}).validator(),
	run (): void {
		NFLLog.remove({});
	},
});
export const clearNFLLogsSync = Meteor.wrapAsync(
	clearNFLLogs.call,
	clearNFLLogs,
);

export const endOfSurvivorMessage = new ValidatedMethod({
	name: 'NFLLogs.endOfSurvivorMessage',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
	}).validator(),
	run ({ league }: { league: string }): void {
		const users: TSortedSurvivor[] = getSortedSurvivorPicksSync({ league });
		const MESSAGE = 'The survivor pool is now over.';
		const systemVals = getSystemValues.call({});
		const currentYear = systemVals.year_updated;

		users.forEach(
			// eslint-disable-next-line @typescript-eslint/camelcase
			({ place, tied, user_id }): void => {
				const message = `${MESSAGE}  You finished ${
					tied ? 'tied for' : 'in'
				} ${formattedPlace(place)} place.  ${
					place <= TOP_SURVIVOR_FOR_HISTORY ? 'Congrats!' : ''
				}`;
				const logEntry = new NFLLog({
					action: 'MESSAGE',
					when: new Date(),
					message,
					// eslint-disable-next-line @typescript-eslint/camelcase
					to_id: user_id,
				});

				logEntry.save();

				if (place <= TOP_SURVIVOR_FOR_HISTORY) {
					const poolHistory = {
						// eslint-disable-next-line @typescript-eslint/camelcase
						user_id,
						year: currentYear,
						league,
						type: 'S',
						place,
					};

					addPoolHistory.call({ poolHistory }, handleError);
				}
			},
		);
	},
});
export const endOfSurvivorMessageSync = Meteor.wrapAsync(
	endOfSurvivorMessage.call,
	endOfSurvivorMessage,
);

export const endOfWeekMessage = new ValidatedMethod({
	name: 'NFLLog.insert.endOfWeekMessage',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week' },
	}).validator(),
	run ({ week }: { week: TWeek }): void {
		const users: TUser[] = getUsers.call({ activeOnly: true });
		const MESSAGE = `Week ${week} is now over.`;
		const systemVals = getSystemValues.call({});
		const currentYear = systemVals.year_updated;

		users.forEach(
			(user): void => {
				// eslint-disable-next-line @typescript-eslint/camelcase
				const user_id = user._id;

				user.leagues.forEach(
					(league): void => {
						const tiebreaker = getTiebreakerFromServer.call({
							league,
							// eslint-disable-next-line @typescript-eslint/camelcase
							user_id,
							week,
						});
						const place = tiebreaker.place_in_week;
						const message = `${MESSAGE}  You finished in ${formattedPlace(
							place,
						)} place.  ${place < 3 ? 'Congrats!' : ''}`;
						const logEntry = new NFLLog({
							action: 'MESSAGE',
							when: new Date(),
							message,
							// eslint-disable-next-line @typescript-eslint/camelcase
							to_id: user_id,
						});

						logEntry.save();

						if (place <= TOP_WEEKLY_FOR_HISTORY) {
							const poolHistory = {
								// eslint-disable-next-line @typescript-eslint/camelcase
								user_id,
								year: currentYear,
								league,
								type: 'W',
								week,
								place,
							};

							addPoolHistory.call({ poolHistory }, handleError);
						}
					},
				);
			},
		);
	},
});
export const endOfWeekMessageSync = Meteor.wrapAsync(
	endOfWeekMessage.call,
	endOfWeekMessage,
);
