import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { Class } from 'meteor/jagi:astronomy';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import { dbVersion } from '../constants';
import { getCurrentSeasonYear } from '../global';

type TConnection = {
	opened: Date;
	on_view_my_picks: boolean;
	on_view_all_picks: boolean;
	scoreboard_open: boolean;
};

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
				return Object.values<TConnection>(this.current_connections).some(
					(conn): boolean =>
						// Do we need to check time opened too? Maybe to prevent someone leaving this open all day?
						conn.on_view_my_picks ||
						conn.on_view_all_picks ||
						conn.scoreboard_open,
				);
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
				return Object.values<TConnection>(this.current_connections).some(
					(conn): boolean =>
						// Do we need to check time opened too? Maybe to prevent someone leaving this open all day?
						conn.on_view_my_picks ||
						conn.on_view_all_picks ||
						conn.scoreboard_open,
				);
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
		[k: string]: TConnection;
	};
	shouldUpdateFaster: () => boolean;
	save: () => void;
};

export const createSystemValues = new ValidatedMethod({
	name: 'SystemVals.createSystemValues',
	validate: new SimpleSchema({}).validator(),
	run (): void {
		const systemVal: TSystemVals = new SystemVal({
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

export const getSystemValues = new ValidatedMethod({
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

export const removeYearUpdated = new ValidatedMethod({
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

export const systemValuesExist = new ValidatedMethod({
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
	// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
	//@ts-ignore
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
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
//@ts-ignore
export const toggleScoreboard = new ValidatedMethod<TToggleScoreboardProps>({
	name: 'SystemVal.updateScoreboard',
	validate: new SimpleSchema({
		isOpen: { type: Boolean, label: 'Is Open' },
	}).validator(),
	run ({ isOpen }: TToggleScoreboardProps): void {
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		//@ts-ignore
		if (!this.userId)
			throw new Meteor.Error(
				'SystemVal.updateScoreboard.not-signed-in',
				'You must be logged in to update system values',
			);

		if (Meteor.isServer) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			//@ts-ignore
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
