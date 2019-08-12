import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import {
	Tiebreaker,
	TTiebreaker,
} from '../../imports/api/collections/tiebreakers';
import { getLastGameOfWeek } from '../../imports/api/collections/games';
import { TWeek } from '../../imports/api/commonTypes';

export const addTiebreaker = new ValidatedMethod({
	name: 'Tiebreakers.addTiebreaker',
	validate: new SimpleSchema({
		tiebreaker: { type: Object, label: 'Tiebreaker', blackbox: true },
	}).validator(),
	run ({ tiebreaker }: { tiebreaker: TTiebreaker }): void {
		const newTiebreaker = new Tiebreaker(tiebreaker);

		newTiebreaker.save();
	},
});
export const addTiebreakerSync = Meteor.wrapAsync(
	addTiebreaker.call,
	addTiebreaker,
);

export const clearTiebreakers = new ValidatedMethod({
	name: 'Tiebreakers.clearTiebreakers',
	validate: new SimpleSchema({}).validator(),
	run (): void {
		Tiebreaker.remove({});
	},
});
export const clearTiebreakersSync = Meteor.wrapAsync(
	clearTiebreakers.call,
	clearTiebreakers,
);

export const getTiebreakerFromServer = new ValidatedMethod({
	name: 'Tiebreaker.getTiebreakerFromServer',
	validate: new SimpleSchema({
		league: { type: String, label: 'League' },
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: { type: String, label: 'User ID' },
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({
		league,
		week,
		// @ts-ignore
		user_id = this.userId, // eslint-disable-line @typescript-eslint/camelcase
	}: {
		league: string;
		user_id: string;
		week: TWeek;
	}): TTiebreaker {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const tb = Tiebreaker.findOne({ user_id, week, league });

		if (!tb) throw new Meteor.Error('No tiebreaker found');

		return tb;
	},
});
export const getTiebreakerFromServerSync = Meteor.wrapAsync(
	getTiebreakerFromServer.call,
	getTiebreakerFromServer,
);

export const removeAllTiebreakersForUser = new ValidatedMethod({
	name: 'Tiebreakers.removeAllTiebreakersForUser',
	validate: new SimpleSchema({
		league: { type: String, label: 'League', optional: true },
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: { type: String, label: 'User ID' },
	}).validator(),
	// eslint-disable-next-line @typescript-eslint/camelcase
	run ({ league, user_id }: { league: string; user_id: string }): void {
		if (league == null) {
			// eslint-disable-next-line @typescript-eslint/camelcase
			Tiebreaker.remove({ user_id }, { multi: true });
		} else {
			// eslint-disable-next-line @typescript-eslint/camelcase
			Tiebreaker.remove({ league, user_id }, { multi: true });
		}
	},
});
export const removeAllTiebreakersForUserSync = Meteor.wrapAsync(
	removeAllTiebreakersForUser.call,
	removeAllTiebreakersForUser,
);

export const updateLastGameOfWeekScore = new ValidatedMethod({
	name: 'Tiebreakers.updateLastGameOfWeekScore',
	validate: new SimpleSchema({
		week: { type: Number, label: 'Week', min: 1, max: 17 },
	}).validator(),
	run ({ week }: { week: TWeek }): void {
		const lastGame = getLastGameOfWeek.call({ week });
		const totalScore = lastGame.home_score + lastGame.visitor_score;

		Tiebreaker.update(
			{ week },
			// eslint-disable-next-line @typescript-eslint/camelcase
			{ $set: { last_score_act: totalScore } },
			{ multi: true },
		);
	},
});
export const updateLastGameOfWeekScoreSync = Meteor.wrapAsync(
	updateLastGameOfWeekScore.call,
	updateLastGameOfWeekScore,
);
