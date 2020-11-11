import {
	ACCOUNT_TYPES,
	ACTIONS,
	ALL_GAME_NUMBERS,
	ALL_WEEKS,
	AUTO_PICK_TYPES,
} from './constants';

export type Lit = string | number | boolean | undefined | null | void | {};

export const tuple = <T extends Lit[]>(...args: T): T => args;

export type TAdminMessage = { game: string; reason: string };

export type TAutoPickStrategy = typeof AUTO_PICK_TYPES[number] | '';

export type TDateDifference = {
	days: number;
	delta: number;
	hours: number;
	minutes: number;
	seconds: number;
	totalSeconds: number;
};

export type TEmailTemplate = {
	adminScreen:
		| false
		| {
				emailBody: boolean;
				path?: string;
		  };
	description?: string;
	route: { path: string };
	template: string;
};

export type TError = Error | Meteor.Error | Meteor.TypedError | undefined;

export type TGameNumber = typeof ALL_GAME_NUMBERS[number];

export type TGameStatus = 'P' | 'I' | '1' | '2' | 'H' | '3' | '4' | 'C';

export type TGameTeam = 'home' | 'visitor' | 'winner';

export type TLoginType =
	| 'loginWithFacebook'
	| 'loginWithGoogle'
	| 'loginWithTwitter';

export type TNFLLogAction = typeof ACTIONS[number];

export type TPaymentType = typeof ACCOUNT_TYPES[number];

export type TRightSlider = null | 'messages' | 'rules' | 'scoreboard';

export type TSortResult = -1 | 0 | 1;

export type TWeek = typeof ALL_WEEKS[number];
