import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import { TWeek } from '../commonTypes';
import { dbVersion } from '../constants';

export type TAPICall = {
	_id: string;
	date: Date;
	error: any | null;
	response: any | null;
	url: string;
	week: TWeek;
	year: number;
};

const APICalls = new Mongo.Collection('apicalls');
let APICallsConditional = null;

if (dbVersion >= 2) {
	APICallsConditional = Class.create({
		name: 'APICalls',
		collection: APICalls,
		secured: true,
		fields: {
			date: {
				type: Date,
				default: (): Date => new Date(),
			},
			error: {
				type: Object,
				optional: true,
			},
			response: {
				type: Object,
				optional: true,
			},
			url: String,
			week: {
				type: Number,
				optional: true,
				validators: [
					{
						type: 'and',
						param: [
							{ type: 'required' },
							{ type: 'gte', param: 1 },
							{ type: 'lte', param: 17 },
						],
					},
				],
			},
			year: {
				type: Number,
				validators: [{ type: 'gte', param: 2019 }], // BD: First year we added this collection
			},
		},
		helpers: {},
		indexes: {},
	});
}

export const APICall = APICallsConditional;

/**
 * All client side API call logic
 */

export type TGetAPICallsProps = {
	filters: { [k: string]: any };
	sort: { [k: string]: -1 | 1 };
};
export const getAPICalls = new ValidatedMethod<TGetAPICallsProps>({
	name: 'APICalls.getAPICalls',
	validate: new SimpleSchema({
		filters: { type: Object, label: 'API Call Filters', blackbox: true },
		sort: { type: Object, label: 'API Call Sort', blackbox: true },
	}).validator(),
	run ({ filters, sort }: TGetAPICallsProps): TAPICall[] {
		return APICall.find(filters, { sort }).fetch();
	},
});
export const getAPICallsSync = Meteor.wrapAsync(getAPICalls.call, getAPICalls);
