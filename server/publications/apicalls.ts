import { Meteor } from 'meteor/meteor';
//import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { APICall, TAPICall } from '../../imports/api/collections/apicalls';
//import { TWeek } from '../../imports/api/commonTypes';

export type TAPIFilters = {
	[k: string]: any;
};
export type TAPISort = {};

Meteor.publish('apiCalls', function (
	filters: TAPIFilters,
	sort: TAPISort,
): TAPICall | void {
	const apiCalls = APICall.find(filters, { sort });

	return apiCalls || this.ready();
});
