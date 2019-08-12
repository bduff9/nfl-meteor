import { Meteor } from 'meteor/meteor';

import {
	SystemVal,
	TSystemVals,
} from '../../imports/api/collections/systemvals';

Meteor.publish('systemValues', function (): TSystemVals | void {
	const systemVals = SystemVal.find();

	if (systemVals) return systemVals;

	return this.ready();
});
