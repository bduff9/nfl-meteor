'use strict';

import { Meteor } from 'meteor/meteor';

import { SystemVal } from '../../imports/api/collections/systemvals';

Meteor.publish('systemValues', function () {
	const systemVals = SystemVal.find();

	if (systemVals) return systemVals;

	return this.ready();
});
