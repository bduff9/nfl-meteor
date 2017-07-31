'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { SurvivorPick } from '../../imports/api/collections/survivorpicks';

export const addSurvivorPick = new ValidatedMethod({
	name: 'SurvivorPicks.addSurvivorPick',
	validate: new SimpleSchema({
		survivorPick: { type: Object, label: 'Survivor Pick', blackbox: true }
	}).validator(),
	run ({ survivorPick }) {
		const newPick = new SurvivorPick(survivorPick);
		newPick.save();
	}
});
export const addSurvivorPickSync = Meteor.wrapAsync(addSurvivorPick.call, addSurvivorPick);

export const removeAllSurvivorPicksForUser = new ValidatedMethod({
	name: 'SurvivorPicks.removeAllSurvivorPicksForUser',
	validate: new SimpleSchema({
		league: { type: String, label: 'League', optional: true },
		user_id: { type: String, label: 'User ID' }
	}).validator(),
	run ({ league, user_id }) {
		if (Meteor.isServer) SurvivorPick.remove({ league, user_id }, { multi: true });
	}
});
export const removeAllSurvivorPicksForUserSync = Meteor.wrapAsync(removeAllSurvivorPicksForUser.call, removeAllSurvivorPicksForUser);
