'use strict';

import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { SurvivorPick } from '../../imports/api/collections/survivorpicks';

Meteor.publish('mySurvivorPicks', function (league) {
	let picks;
	if (!this.userId) return this.ready();
	new SimpleSchema({
		league: { type: String, label: 'League' }
	}).validate({ league });
	picks = SurvivorPick.find({ league, user_id: this.userId }, {
		fields: {
			'_id': 1,
			'user_id': 1,
			'league': 1,
			'week': 1,
			'game_id': 1,
			'pick_id': 1,
			'pick_short': 1,
			'winner_id': 1,
			'winner_short': 1
		},
		sort: {
			week: 1
		}});
	if (picks) return picks;
	return this.ready();
});

Meteor.publish('overallSurvivor', function (league, week) {
	let overallSurvivor;
	new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validate({ league, week });
	if (!this.userId) return this.ready();
	overallSurvivor = SurvivorPick.find({ league, week: { $lte: week }}, {
		fields: {
			'_id': 1,
			'user_id': 1,
			'league': 1,
			'week': 1,
			'game_id': 1,
			'pick_id': 1,
			'pick_short': 1,
			'winner_id': 1,
			'winner_short': 1
		}
	});
	if (overallSurvivor) return overallSurvivor;
	return this.ready();
});

Meteor.publish('weekSurvivor', function (league, week) {
	let weekSurvivor;
	new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validate({ league, week });
	if (!this.userId) return this.ready();
	weekSurvivor = SurvivorPick.find({ league, week }, {
		fields: {
			'_id': 1,
			'user_id': 1,
			'league': 1,
			'week': 1,
			'game_id': 1,
			'pick_id': 1,
			'pick_short': 1,
			'winner_id': 1,
			'winner_short': 1
		}
	});
	if (weekSurvivor) return weekSurvivor;
	return this.ready();
});
