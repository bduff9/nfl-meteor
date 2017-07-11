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
