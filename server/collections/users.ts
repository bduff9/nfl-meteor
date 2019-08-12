import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import {
	Tiebreaker,
	TTiebreaker,
} from '../../imports/api/collections/tiebreakers';
import { User, TUser } from '../../imports/api/collections/users';
import { TSortResult, TWeek } from '../../imports/api/commonTypes';

/**
 * All server side user logic
 */

export const getLowestScore = new ValidatedMethod({
	name: 'Users.getLowestScore',
	validate: new SimpleSchema({
		// eslint-disable-next-line @typescript-eslint/camelcase
		current_user_ids: { type: [String], label: 'User IDs to Exclude' },
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Current Week', min: 2 },
	}).validator(),
	run ({
		// eslint-disable-next-line @typescript-eslint/camelcase
		current_user_ids,
		league,
		week,
	}: {
		current_user_ids: string[];
		league: string;
		week: TWeek;
	}): TUser | null {
		const allUsers = Tiebreaker.find({
			league,
			// eslint-disable-next-line @typescript-eslint/camelcase
			user_id: { $nin: current_user_ids },
			week: { $lt: week },
		}).fetch();
		const combinedUserObj = allUsers.reduce(
			(
				sorted: { [k: string]: number },
				user: TTiebreaker,
			): { [k: string]: number } => {
				if (sorted[user.user_id]) {
					sorted[user.user_id] += user.points_earned;
				} else {
					sorted[user.user_id] = user.points_earned;
				}

				return sorted;
			},
			{},
		);
		const combinedUsers = Object.keys(combinedUserObj).map(
			// eslint-disable-next-line @typescript-eslint/camelcase
			(user_id): { user_id: string; points: number } => ({
				// eslint-disable-next-line @typescript-eslint/camelcase
				user_id,
				points: combinedUserObj[user_id],
			}),
		);
		const sortedUsers = combinedUsers.sort(
			(a, b): TSortResult => {
				if (a.points < b.points) return -1;

				if (a.points > b.points) return 1;

				return 0;
			},
		);
		// eslint-disable-next-line @typescript-eslint/camelcase
		const user_id = sortedUsers[0] && sortedUsers[0].user_id;

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (!user_id) return null;

		return User.findOne(user_id);
	},
});
export const getLowestScoreSync = Meteor.wrapAsync(
	getLowestScore.call,
	getLowestScore,
);
