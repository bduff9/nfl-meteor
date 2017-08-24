'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

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

export const clearTiebreakers = new ValidatedMethod({
	name: 'Tiebreakers.clearTiebreakers',
	validate: new SimpleSchema({}).validator(),
	run () {
		Tiebreaker.remove({});
	}
});
export const clearTiebreakersSync = Meteor.wrapAsync(clearTiebreakers.call, clearTiebreakers);

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

export const removeAllTiebreakersForUser = new ValidatedMethod({
	name: 'Tiebreakers.removeAllTiebreakersForUser',
	validate: new SimpleSchema({
		league: { type: String, label: 'League', optional: true },
		user_id: { type: String, label: 'User ID' }
	}).validator(),
	run ({ league, user_id }) {
		if (league == null) {
			Tiebreaker.remove({ user_id }, { multi: true });
		} else {
			Tiebreaker.remove({ league, user_id }, { multi: true });
		}
	}
});
export const removeAllTiebreakersForUserSync = Meteor.wrapAsync(removeAllTiebreakersForUser.call, removeAllTiebreakersForUser);

export const updateLastGameOfWeekScore = new ValidatedMethod({
	name: 'Tiebreakers.updateLastGameOfWeekScore',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week', min: 1, max: 17 }
	}).validator(),
	run ({ week }) {
		const lastGame = getLastGameOfWeek.call({ week }),
				totalScore = (lastGame.home_score + lastGame.visitor_score);
		Tiebreaker.update({ week }, { $set: { last_score_act: totalScore }}, { multi: true });
	}
});
export const updateLastGameOfWeekScoreSync = Meteor.wrapAsync(updateLastGameOfWeekScore.call, updateLastGameOfWeekScore);
