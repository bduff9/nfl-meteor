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
