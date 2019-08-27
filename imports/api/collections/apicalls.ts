import { Class } from 'meteor/jagi:astronomy';
import { Mongo } from 'meteor/mongo';

import { TWeek } from '../commonTypes';
import { dbVersion } from '../constants';

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

export type TAPICall = {
	_id: string;
	date: Date;
	error: any | null;
	response: any | null;
	url: string;
	week: TWeek;
	year: number;
};
