import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Meteor } from 'meteor/meteor';

import { APICall } from '../../imports/api/collections/apicalls';
import { TWeek } from '../../imports/api/commonTypes';
import { TAPIMatchup } from '../api-calls';

export type TInsertAPICallProps = {
	error?: any;
	response: { nflSchedule: { matchup: TAPIMatchup[] } };
	url: string;
	week: TWeek;
	year: number;
};
export const insertAPICall = new ValidatedMethod<TInsertAPICallProps>({
	name: 'APICalls.insertAPICall',
	validate: new SimpleSchema({
		error: { type: Object, blackbox: true, optional: true, label: 'Error' },
		response: {
			type: Object,
			blackbox: true,
			optional: true,
			label: 'Response',
		},
		url: { type: String, label: 'API URL Called', min: 3 },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
		year: { type: Number, label: 'Year', min: 2019 },
	}).validator(),
	run ({ error, response, url, week, year }: TInsertAPICallProps): void {
		const apiCall = new APICall({
			date: new Date(),
			error,
			response,
			url,
			week,
			year,
		});

		apiCall.save();
	},
});
export const insertAPICallSync = Meteor.wrapAsync(
	insertAPICall.call,
	insertAPICall,
);
