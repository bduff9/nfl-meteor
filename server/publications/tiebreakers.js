'use strict';

import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Tiebreaker } from '../../imports/api/collections/tiebreakers';

Meteor.publish('allTiebreakersForWeek', function (week, league) {
	let tiebreakers;
	if (!this.userId) return this.ready();
	new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validate({ league, week });
	tiebreakers = Tiebreaker.find({ week, league }, {
		fields: {
			'_id': 1,
			'user_id': 1,
			'week': 1,
			'league': 1,
			'last_score': 1,
			'submitted': 1,
			'last_score_act': 1,
			'points_earned': 1,
			'games_correct': 1,
			'place_in_week': 1,
			'tied_flag': 1
		},
		sort: {
			'points_earned': -1,
			'games_correct': -1
		}
	});
	if (tiebreakers) return tiebreakers;
	return this.ready();
});

Meteor.publish('singleTiebreakerForUser', function (week, league) {
	let tiebreakers;
	if (!this.userId) return this.ready();
	new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validate({ league, week });
	tiebreakers = Tiebreaker.find({ week, user_id: this.userId, league }, {
		fields: {
			'_id': 1,
			'user_id': 1,
			'week': 1,
			'league': 1,
			'last_score': 1,
			'submitted': 1,
			'last_score_act': 1,
			'points_earned': 1,
			'games_correct': 1,
			'place_in_week': 1,
			'tied_flag': 1
		}
	});
	if (tiebreakers) return tiebreakers;
	return this.ready();
});
