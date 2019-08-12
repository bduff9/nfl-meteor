import { Meteor } from 'meteor/meteor';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import {
	Tiebreaker,
	TTiebreaker,
} from '../../imports/api/collections/tiebreakers';
import { TWeek } from '../../imports/api/commonTypes';

Meteor.publish('allTiebreakersForUser', function (
	league: string,
): TTiebreaker | void {
	let tiebreakers;

	if (!this.userId) return this.ready();

	new SimpleSchema({
		league: { type: String, label: 'League' },
	}).validate({ league });
	tiebreakers = Tiebreaker.find(
		// eslint-disable-next-line @typescript-eslint/camelcase
		{ league, user_id: this.userId },
		{
			fields: {
				_id: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				user_id: 1,
				week: 1,
				league: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				last_score: 1,
				submitted: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				last_score_act: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				points_earned: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				games_correct: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				place_in_week: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				tied_flag: 1,
			},
			sort: {
				week: 1,
			},
		},
	);

	if (tiebreakers) return tiebreakers;

	return this.ready();
});

Meteor.publish('allTiebreakersForWeek', function (
	week: TWeek,
	league: string,
): TTiebreaker[] | void {
	let tiebreakers;

	if (!this.userId) return this.ready();

	new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validate({ league, week });
	tiebreakers = Tiebreaker.find(
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
				last_score: 1,
				submitted: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				last_score_act: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				points_earned: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				games_correct: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				place_in_week: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				tied_flag: 1,
			},
			sort: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				points_earned: -1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				games_correct: -1,
			},
		},
	);

	if (tiebreakers) return tiebreakers;

	return this.ready();
});

Meteor.publish('singleTiebreakerForUser', function (
	week: TWeek,
	league: string,
): TTiebreaker | void {
	let tiebreakers;

	if (!this.userId) return this.ready();

	new SimpleSchema({
		league: { type: String, label: 'League' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validate({ league, week });
	tiebreakers = Tiebreaker.find(
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
				last_score: 1,
				submitted: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				last_score_act: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				points_earned: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				games_correct: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				place_in_week: 1,
				// eslint-disable-next-line @typescript-eslint/camelcase
				tied_flag: 1,
			},
		},
	);

	if (tiebreakers) return tiebreakers;

	return this.ready();
});
