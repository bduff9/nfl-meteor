import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import { Pick, TPick } from '../../imports/api/collections/picks';
import { TWeek } from '../../imports/api/commonTypes';

Meteor.publish('allPicks', function (league: string): TPick[] | void {
	let picks;

	if (!this.userId) return this.ready();

	new SimpleSchema({
		league: { type: String, label: 'League' },
	}).validate({ league });
	picks = Pick.find(
		{ league },
		{
			fields: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				user_id: 1,
				week: 1,
				league: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				game_id: 1,
				game: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				pick_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				pick_short: 1,
				points: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				winner_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				winner_short: 1,
			},
			sort: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				user_id: 1,
				week: 1,
				game: 1,
			},
		},
	);

	if (picks) return picks;

	return this.ready();
});

Meteor.publish('allPicksForWeek', function (
	week: TWeek,
	league: string,
): TPick[] | void {
	let picks;

	if (!this.userId) return this.ready();

	new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validate({ league, week });
	picks = Pick.find(
		{ week, league },
		{
			fields: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				user_id: 1,
				week: 1,
				league: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				game_id: 1,
				game: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				pick_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				pick_short: 1,
				points: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				winner_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				winner_short: 1,
			},
			sort: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				user_id: 1,
				game: 1,
			},
		},
	);

	if (picks) return picks;

	return this.ready();
});

Meteor.publish('singleWeekPicksForUser', function (
	week: TWeek,
	league: string,
): TPick[] | void {
	let picks;

	if (!this.userId) return this.ready();

	new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validate({ league, week });
	picks = Pick.find(
		// eslint-disable-next-line @typescript-eslint/camelcase
		{ week, user_id: this.userId, league },
		{
			fields: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				user_id: 1,
				week: 1,
				league: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				game_id: 1,
				game: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				pick_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				pick_short: 1,
				points: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				winner_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				winner_short: 1,
			},
		},
	);

	if (picks) return picks;

	return this.ready();
});
