import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import {
	SurvivorPick,
	TSurvivorPick,
} from '../../imports/api/collections/survivorpicks';
import { TWeek } from '../../imports/api/commonTypes';

Meteor.publish('mySurvivorPicks', function (
	league: string,
): TSurvivorPick[] | void {
	let picks;

	if (!this.userId) return this.ready();

	new SimpleSchema({
		league: { type: String, label: 'League' },
	}).validate({ league });
	picks = SurvivorPick.find(
		// eslint-disable-next-line @typescript-eslint/camelcase
		{ league, user_id: this.userId },
		{
			fields: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				user_id: 1,
				league: 1,
				week: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				game_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				pick_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				pick_short: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				winner_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				winner_short: 1,
			},
			sort: {
				week: 1,
			},
		},
	);

	if (picks) return picks;

	return this.ready();
});

Meteor.publish('overallSurvivor', function (
	league: string,
	week: TWeek,
): TSurvivorPick[] | void {
	let overallSurvivor;

	new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validate({ league, week });

	if (!this.userId) return this.ready();

	overallSurvivor = SurvivorPick.find(
		{ league, week: { $lte: week } },
		{
			fields: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				user_id: 1,
				league: 1,
				week: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				game_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				pick_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				pick_short: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				winner_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				winner_short: 1,
			},
		},
	);

	if (overallSurvivor) return overallSurvivor;

	return this.ready();
});

Meteor.publish('weekSurvivor', function (
	league: string,
	week: TWeek,
): TSurvivorPick[] | void {
	let weekSurvivor;

	new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validate({ league, week });

	if (!this.userId) return this.ready();

	weekSurvivor = SurvivorPick.find(
		{ league, week },
		{
			fields: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				user_id: 1,
				league: 1,
				week: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				game_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				pick_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				pick_short: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				winner_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				winner_short: 1,
			},
		},
	);

	if (weekSurvivor) return weekSurvivor;

	return this.ready();
});
