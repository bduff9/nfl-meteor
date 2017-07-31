'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Pick } from '../../imports/api/collections/picks';

export const addPick = new ValidatedMethod({
	name: 'Picks.addPick',
	validate: new SimpleSchema({
		pick: { type: Object, label: 'Pick', blackbox: true }
	}).validator(),
	run ({ pick }) {
		const newPick = new Pick(pick);
		newPick.save();
	}
});
export const addPickSync = Meteor.wrapAsync(addPick.call, addPick);

export const removeAllPicksForUser = new ValidatedMethod({
	name: 'Picks.removeAllPicksForUser',
	validate: new SimpleSchema({
		league: { type: String, label: 'League', optional: true },
		user_id: { type: String, label: 'User ID' }
	}).validator(),
	run ({ league, user_id }) {
		if (Meteor.isServer) Pick.remove({ league, user_id }, { multi: true });
	}
});
export const removeAllPicksForUserSync = Meteor.wrapAsync(removeAllPicksForUser.call, removeAllPicksForUser);
