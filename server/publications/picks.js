'use strict';

import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Pick } from '../../imports/api/collections/picks';

Meteor.publish('singleWeekPicksForUser', function (week, league) {
	let picks;
	if (!this.userId) return this.ready();
	new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validate({ league, week });
	picks = Pick.find({ week, user_id: this.userId, league}, {
		fields: {
			'_id': 1,
			'user_id': 1,
			'week': 1,
			'league': 1,
			'game_id': 1,
			'game': 1,
			'pick_id': 1,
			'pick_short': 1,
			'points': 1,
			'winner_id': 1,
			'winner_short': 1
		}
	});
	if (picks) return picks;
	return this.ready();
});
