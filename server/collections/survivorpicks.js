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
