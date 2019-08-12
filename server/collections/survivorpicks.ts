import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';

import {
	SurvivorPick,
	TSurvivorPick,
} from '../../imports/api/collections/survivorpicks';

export const addSurvivorPick = new ValidatedMethod({
	name: 'SurvivorPicks.addSurvivorPick',
	validate: new SimpleSchema({
		survivorPick: { type: Object, label: 'Survivor Pick', blackbox: true },
	}).validator(),
	run({ survivorPick }: { survivorPick: TSurvivorPick }): void {
		const newPick = new SurvivorPick(survivorPick);

		newPick.save();
	},
});
export const addSurvivorPickSync = Meteor.wrapAsync(
	addSurvivorPick.call,
	addSurvivorPick,
);

export const clearSurvivorPicks = new ValidatedMethod({
	name: 'SurvivorPicks.clearSurvivorPicks',
	validate: new SimpleSchema({}).validator(),
	run(): void {
		SurvivorPick.remove({});
	},
});
export const clearSurvivorPicksSync = Meteor.wrapAsync(
	clearSurvivorPicks.call,
	clearSurvivorPicks,
);

export const removeAllSurvivorPicksForUser = new ValidatedMethod({
	name: 'SurvivorPicks.removeAllSurvivorPicksForUser',
	validate: new SimpleSchema({
		league: { type: String, label: 'League', optional: true },
		// eslint-disable-next-line @typescript-eslint/camelcase
		user_id: { type: String, label: 'User ID' },
	}).validator(),
	// eslint-disable-next-line @typescript-eslint/camelcase
	run({ league, user_id }: { league: string; user_id: string }): void {
		if (league == null) {
			// eslint-disable-next-line @typescript-eslint/camelcase
			SurvivorPick.remove({ user_id }, { multi: true });
		} else {
			// eslint-disable-next-line @typescript-eslint/camelcase
			SurvivorPick.remove({ league, user_id }, { multi: true });
		}
	},
});
export const removeAllSurvivorPicksForUserSync = Meteor.wrapAsync(
	removeAllSurvivorPicksForUser.call,
	removeAllSurvivorPicksForUser,
);
