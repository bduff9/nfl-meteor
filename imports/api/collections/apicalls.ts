import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import { dbVersion } from '../constants';
import { getCurrentSeasonYear } from '../global';

const SystemVals = new Mongo.Collection('systemvals');
let SystemValConditional = null;

if (dbVersion < 2) {
	SystemValConditional = Class.create({
		name: 'SystemVal',
		collection: SystemVals,
		secured: true,
		fields: {
			// eslint-disable-next-line @typescript-eslint/camelcase
			games_updating: {
				type: Boolean,
				default: false,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			current_connections: {
				type: Object,
				default: (): {} => ({}),
			},
		},
		helpers: {
			shouldUpdateFaster (): boolean {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				return Object.keys(this.current_connections).some(connId => {
					// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
					// @ts-ignore
					const conn = this.current_connections[connId];

					// Do we need to check time opened too? Maybe to prevent someone leaving this open all day?
					switch (true) {
						case conn.on_view_my_picks:
						case conn.on_view_all_picks:
						case conn.scoreboard_open:
							return true;
						default:
							return false;
					}
				});
			},
		},
		indexes: {},
	});
} else {
	SystemValConditional = Class.create({
		name: 'SystemVal',
		collection: SystemVals,
		secured: true,
		fields: {
			// eslint-disable-next-line @typescript-eslint/camelcase
			year_updated: {
				type: Number,
				validators: [{ type: 'gte', param: 2016 }], // BD: First year we added this attribute
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			games_updating: {
				type: Boolean,
				default: false,
			},
			// eslint-disable-next-line @typescript-eslint/camelcase
			current_connections: {
				type: Object,
				default: (): {} => ({}),
			},
		},
		helpers: {
			shouldUpdateFaster (): boolean {
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				return Object.keys(this.current_connections).some(connId => {
					// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
					// @ts-ignore
					const conn = this.current_connections[connId];

					// Do we need to check time opened too? Maybe to prevent someone leaving this open all day?
					switch (true) {
						case conn.on_view_my_picks:
						case conn.on_view_all_picks:
						case conn.scoreboard_open:
							return true;
						default:
							return false;
					}
				});
			},
		},
		indexes: {},
	});
}

export const SystemVal = SystemValConditional;

export type TSystemVals = {
	year_updated: number;
	games_updating: boolean;
	current_connections: {
		[k: string]: string;
	};
	shouldUpdateFaster: () => boolean;
};

export const createSystemValues = new ValidatedMethod<{}>({
	name: 'SystemVals.createSystemValues',
	validate: new SimpleSchema({}).validator(),
	run (): void {
		const systemVal = new SystemVal({
			// eslint-disable-next-line @typescript-eslint/camelcase
			games_updating: false,
			// eslint-disable-next-line @typescript-eslint/camelcase
			current_connections: {},
			// eslint-disable-next-line @typescript-eslint/camelcase
			year_updated: getCurrentSeasonYear(),
		});

		systemVal.save();
	},
});
export const createSystemValuesSync = Meteor.wrapAsync(
	createSystemValues.call,
	createSystemValues,
);

export const getSystemValues = new ValidatedMethod<{}>({
	name: 'SystemVals.getSystemValues',
	validate: new SimpleSchema({}).validator(),
	run (): TSystemVals {
		const systemVals = SystemVal.findOne();

		if (!systemVals) throw new Meteor.Error('No system values found!');

		return systemVals;
	},
});
export const getSystemValuesSync = Meteor.wrapAsync(
	getSystemValues.call,
	getSystemValues,
);

export const removeYearUpdated = new ValidatedMethod<{}>({
	name: 'SystemVals.removeYearUpdated',
	validate: new SimpleSchema({}).validator(),
	run (): void {
		// eslint-disable-next-line @typescript-eslint/camelcase
		SystemVals.update({}, { $unset: { year_updated: true } }, { multi: true });
	},
});
export const removeYearUpdatedSync = Meteor.wrapAsync(
	removeYearUpdated.call,
	removeYearUpdated,
);

export const systemValuesExist = new ValidatedMethod<{}>({
	name: 'SystemVals.systemValuesExist',
	validate: new SimpleSchema({}).validator(),
	run (): boolean {
		return SystemVal.find().count() > 0;
	},
});
export const systemValuesExistSync = Meteor.wrapAsync(
	systemValuesExist.call,
	systemValuesExist,
);

export type TToggleGamesUpdatingProps = { is_updating: boolean };
export const toggleGamesUpdating = new ValidatedMethod<
	TToggleGamesUpdatingProps
>({
	name: 'SystemVal.toggleGamesUpdating',
	validate: new SimpleSchema({
		// eslint-disable-next-line @typescript-eslint/camelcase
		is_updating: { type: Boolean, label: 'Games are updating' },
	}).validator(),
	// eslint-disable-next-line @typescript-eslint/camelcase
	run ({ is_updating }: TToggleGamesUpdatingProps): void {
		// eslint-disable-next-line @typescript-eslint/camelcase
		SystemVal.update({}, { $set: { games_updating: is_updating } });
	},
});
export const toggleGamesUpdatingSync = Meteor.wrapAsync(
	toggleGamesUpdating.call,
	toggleGamesUpdating,
);

export type TToggleScoreboardProps = { isOpen: boolean };
export const toggleScoreboard = new ValidatedMethod<TToggleScoreboardProps>({
	name: 'SystemVal.updateScoreboard',
	validate: new SimpleSchema({
		isOpen: { type: Boolean, label: 'Is Open' },
	}).validator(),
	run ({ isOpen }: TToggleScoreboardProps): void {
		if (!this.userId)
			throw new Meteor.Error(
				'SystemVal.updateScoreboard.not-signed-in',
				'You must be logged in to update system values',
			);

		if (Meteor.isServer) {
			const connId = this.connection.id;
			const systemVal = SystemVal.findOne();
			const conn = systemVal.current_connections[connId];

			if (conn) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				conn.scoreboard_open = isOpen;
				systemVal.save();
			} else {
				console.log('Connection not found!');
				console.log('connection id', connId);
				console.log('connection', conn);
			}
		}
	},
});
export const toggleScoreboardSync = Meteor.wrapAsync(
	toggleScoreboard.call,
	toggleScoreboard,
);
