import { differenceInSeconds, format } from 'date-fns';
import { Meteor } from 'meteor/meteor';
import { SwalOptions } from 'sweetalert/typings/modules/options';

import { TDashboardUser } from '../ui/layouts/DashLayout';
import { TSortByDir } from '../ui/pages/Dashboard';

import {
	TDateDifference,
	TError,
	TGameNumber,
	TSortResult,
} from './commonTypes';
import { TUser } from './collections/users';
import { TTiebreaker } from './collections/tiebreakers';
import { TPick } from './collections/picks';
import { ALL_GAME_NUMBERS } from './constants';

export const convertEpoch = (epoch: number): Date => {
	const d = new Date(0);

	d.setUTCSeconds(epoch);

	return d;
};

export const formatDate = (dt: Date, incTime = false): string => {
	if (!dt) return '';

	const fmt = incTime ? "h:mma 'on' EEE, MMM do" : 'EEE, MMM do';

	return format(dt, fmt);
};

export const formattedPlace = (place: number): string => {
	const s = ['th', 'st', 'nd', 'rd'];
	const v = place % 100;

	return place + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const getColor = (
	point: TGameNumber,
	max: TGameNumber,
): { backgroundColor: string } => {
	const MAX_COLOR = 255;
	const DOUBLE_MAX_COLOR = MAX_COLOR * 2;
	const percent = point / max;
	const red = Math.min(Math.round((1 - percent) * DOUBLE_MAX_COLOR), MAX_COLOR);
	const green = Math.min(Math.round(percent * DOUBLE_MAX_COLOR), MAX_COLOR);
	const blue = 0;

	return { backgroundColor: `rgb(${red}, ${green}, ${blue})` };
};

export const getCurrentSeasonYear = (): number => {
	const currDate = new Date();
	const currMonth = currDate.getMonth();
	const currYear = currDate.getFullYear() - (currMonth < 2 ? 1 : 0);

	return currYear;
};

export const getFormControlClass = (
	touched: boolean | undefined,
	error: string | undefined,
	baseClass: string | undefined = 'form-control',
): string => {
	if (!touched) return baseClass;

	if (error) return `${baseClass} is-invalid`;

	return `${baseClass} is-valid`;
};

/**
 * Currently not used since bootstrap v4 updated form validation styles
 * @param error
 * @param touched
 * @param prefix
 */
export const getInputColor = (
	error?: string,
	touched?: boolean,
	prefix?: string,
): string => {
	if (!touched) return '';

	if (error) return prefix + 'danger';

	return prefix + 'success';
};

export const getTimeDifferenceObject = (
	newerDate: Date,
	olderDate: Date,
): TDateDifference => {
	const totalSeconds = differenceInSeconds(newerDate, olderDate);
	let delta = totalSeconds;
	const days = Math.floor(delta / 86400);

	delta -= days * 86400;

	const hours = Math.floor(delta / 3600) % 24;

	delta -= hours * 3600;

	const minutes = Math.floor(delta / 60) % 60;

	delta -= minutes * 60;

	const seconds = delta % 60;

	return {
		days,
		delta,
		hours,
		minutes,
		seconds,
		totalSeconds,
	};
};

export const handleError = (
	err: TError,
	opts: Partial<SwalOptions> = {},
	cb: (() => void) | null = null,
	hide = false,
): void | Promise<boolean> => {
	if (!err) return;

	if (Meteor.isClient && !hide) {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const sweetAlert = require('sweetalert');

		opts.title = opts.title || 'Error Occurred';
		opts.text = `${opts.text ||
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			err.reason ||
			err.message ||
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			err.error ||
			'Something went wrong, please try again'}`;
		opts.icon = opts.icon || 'error';

		return sweetAlert(opts);
	} else {
		console.error(opts.title || 'Caught error', err);

		if (cb) cb();
	}
};

export const humanizeVariable = (value: string): string => {
	const result = value.replace(/([A-Z])/g, ' $1');

	return result.charAt(0).toUpperCase() + result.slice(1);
};

export const sortForDash = (
	pointsSort: TSortByDir,
	gamesSort: TSortByDir,
	user1: TDashboardUser,
	user2: TDashboardUser,
): TSortResult => {
	if (pointsSort) {
		if (user1.total_points < user2.total_points)
			return (-1 * pointsSort) as TSortResult;

		if (user1.total_points > user2.total_points) return pointsSort;
	}

	if (gamesSort) {
		if (user1.total_games < user2.total_games)
			return (-1 * gamesSort) as TSortResult;

		if (user1.total_games > user2.total_games) return gamesSort;
	}

	return 0;
};

export const weekPlacer = (
	user1: TTiebreaker,
	user2: TTiebreaker,
): TSortResult => {
	const lastScoreDiff1 = (user1.last_score_act || 0) - (user1.last_score || 0);
	const lastScoreDiff2 = (user2.last_score_act || 0) - (user2.last_score || 0);

	// First, sort by points
	if (user1.points_earned > user2.points_earned) return -1;

	if (user1.points_earned < user2.points_earned) return 1;

	// Then, sort by games correct
	if (user1.games_correct > user2.games_correct) return -1;

	if (user1.games_correct > user2.games_correct) return 1;

	// Stop here if last game hasn't been played
	if (!user1.last_score_act && !user2.last_score_act) return 0;

	// Otherwise, sort by whomever didn't go over the last game's score
	if (lastScoreDiff1 >= 0 && lastScoreDiff2 < 0) return -1;

	if (lastScoreDiff1 < 0 && lastScoreDiff2 >= 0) return 1;

	// Next, sort by the closer to the last games score
	if (Math.abs(lastScoreDiff1) < Math.abs(lastScoreDiff2)) return -1;

	if (Math.abs(lastScoreDiff1) > Math.abs(lastScoreDiff2)) return 1;

	// Finally, if we get here, then they are identical
	return 0;
};

export const overallPlacer = (user1: TUser, user2: TUser): TSortResult => {
	// First, sort by points
	if (user1.total_points > user2.total_points) return -1;

	if (user1.total_points < user2.total_points) return 1;

	// Then, sort by games correct
	if (user1.total_games > user2.total_games) return -1;

	if (user1.total_games < user2.total_games) return 1;

	// Finally, if we get here, then they are identical
	return 0;
};

/**
 * Pads a string to given length with padWith ('0' by default)
 * @param {String | Number} toPad Value to pad
 * @param {Number} ln The length to pad to
 * @param {String} padWith (Optional) String to pad with, '0' by default
 */
export const pad = (
	toPad: string | number,
	ln: number,
	padWith = '0',
): string => {
	let padded = '' + toPad;

	while (padded.length < ln) padded = '' + padWith + padded;

	return padded;
};

/**
 * Finds next unused point value to assign user.
 * Used for missed picks, quick picks, and auto picks
 *
 * @param {Array} userPicks All users picks for a given week
 * @param {Object} user Need for first and last name
 * @returns {Number} The next unused point value
 */
export const getNextPointValue = (
	userPicks: TPick[],
	user: TUser,
): TGameNumber | null => {
	const pointsUsed = userPicks
		.map((pick): number | null | undefined => pick.points)
		.filter((point): boolean => point != null);
	const maxPointVal = ALL_GAME_NUMBERS.length;

	for (let i = 0; i < maxPointVal; i++) {
		const pointVal = ALL_GAME_NUMBERS[i];

		if (pointsUsed.indexOf(pointVal) === -1) return pointVal;
	}

	console.error(
		`While trying to assign unused points to user ${user.first_name} ${
			user.last_name
		}, reached max point value of ${maxPointVal}, meaning all points from 1 to ${maxPointVal} are used, yet somehow we got into this block where a pick was missed.  Should be impossible so adding this long comment just to ensure visibility if it ever happens.`,
	);

	return null;
};
