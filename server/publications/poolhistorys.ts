import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import {
	PoolHistory,
	TPoolHistory,
} from '../../imports/api/collections/poolhistorys';

Meteor.publish('poolHistoryForYear', function (
	league: string,
	year: number,
): TPoolHistory[] | void {
	let history;

	if (!this.userId) return this.ready();

	new SimpleSchema({
		league: { type: String, label: 'League' },
		year: { type: Number, label: 'History Year' },
	}).validate({ league, year });
	history = PoolHistory.find(
		{ league, year },
		{
			fields: {
				_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				user_id: 1,
				year: 1,
				league: 1,
				type: 1,
				week: 1,
				place: 1,
			},
			sort: {
				type: 1,
				week: 1,
				place: 1,
			},
		},
	);

	if (history) return history;

	return this.ready();
});
