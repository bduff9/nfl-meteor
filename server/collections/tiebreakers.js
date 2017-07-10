'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { logError } from '../../imports/api/global';
import { Tiebreaker } from '../../imports/api/collections/tiebreakers';
import { getLastGameOfWeek } from '../../imports/api/collections/games';

export const addTiebreaker = new ValidatedMethod({
	name: 'Tiebreakers.addTiebreaker',
	validate: new SimpleSchema({
		tiebreaker: { type: Object, label: 'Tiebreaker', blackbox: true }
	}).validator(),
	run ({ tiebreaker }) {
		const newTiebreaker = new Tiebreaker(tiebreaker);
		newTiebreaker.save();
	}
});
export const addTiebreakerSync = Meteor.wrapAsync(addTiebreaker.call, addTiebreaker);

export const getTiebreakerFromServer = new ValidatedMethod({
	name: 'Tiebreaker.getTiebreakerFromServer',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		user_id: { type: String, label: 'User ID' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({ league, week }) {
		const user_id = this.userId;
		const tb = Tiebreaker.findOne({ user_id, week, league });
		if (!user_id) throw new Meteor.Error('You are not signed in!');
		if (!tb) throw new Meteor.Error('No tiebreaker found');
		return tb;
	}
});
export const getTiebreakerFromServerSync = Meteor.wrapAsync(getTiebreakerFromServer.call, getTiebreakerFromServer);

export const updateLastGameOfWeekScore = new ValidatedMethod({
	name: 'Tiebreakers.updateLastGameOfWeekScore',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ week }) {
		const lastGame = getLastGameOfWeek.call({ week }, logError),
				totalScore = (lastGame.home_score + lastGame.visitor_score);
		Tiebreaker.update({ week }, { $set: { last_score_act: totalScore }}, { multi: true });
	}
});
export const updateLastGameOfWeekScoreSync = Meteor.wrapAsync(updateLastGameOfWeekScore.call, updateLastGameOfWeekScore);
