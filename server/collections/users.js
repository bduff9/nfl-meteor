'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Tiebreaker } from '../../imports/api/collections/tiebreakers';
import { User } from '../../imports/api/collections/users';

/**
 * All server side user logic
 */

export const getLowestScore = new ValidatedMethod({
	name: 'Users.getLowestScore',
	validate: new SimpleSchema({
		current_user_ids: { type: [String], label: 'User IDs to Exclude' },
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Current Week', min: 2 }
	}).validator(),
	run ({ current_user_ids, league, week }) {
		const allUsers = Tiebreaker.find({ league, user_id: { $nin: current_user_ids }, week: { $lt: week }}).fetch();
		const combinedUserObj = allUsers.reduce((sorted, user) => {
			if (sorted[user.user_id]) {
				sorted[user.user_id] += user.points_earned;
			} else {
				sorted[user.user_id] = user.points_earned;
			}

			return sorted;
		}, {});
		const combinedUsers = Object.keys(combinedUserObj).map(user_id => ({ user_id, points: combinedUserObj[user_id] }));
		const sortedUsers = combinedUsers.sort((a, b) => {
			if (a.points < b.points) return -1;

			if (a.points > b.points) return 1;

			return 0;
		});
		const user_id = sortedUsers[0] && sortedUsers[0].user_id;

		if (!user_id) return null;

		return User.findOne(user_id);
	}
});
export const getLowestScoreSync = Meteor.wrapAsync(getLowestScore.call, getLowestScore);
