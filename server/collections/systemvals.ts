import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { SystemVal } from '../../imports/api/collections/systemvals';

export const clearSystemVals = new ValidatedMethod<{}>({
	name: 'SystemVals.clearSystemVals',
	validate: new SimpleSchema({}).validator(),
	run (): void {
		SystemVal.remove({});
	},
});
export const clearSystemValsSync = Meteor.wrapAsync(
	clearSystemVals.call,
	clearSystemVals,
);
