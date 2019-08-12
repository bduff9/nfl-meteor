import format from 'date-fns/format';
import differenceInSeconds from 'date-fns/difference_in_seconds';
import { Meteor } from 'meteor/meteor';
import { SwalOptions } from 'sweetalert/typings/modules/options';

import {
	TGameNumber,
	TDateDifference,
	TSortResult,
	TWeek,
} from './commonTypes';
import { TUser } from './collections/users';
import { TTiebreaker } from './collections/tiebreakers';
import { TPick } from './collections/picks';
import { ALL_GAME_NUMBERS } from './constants';

export const convertEpoch = (epoch: number): Date => {
	let d = new Date(0);

	d.setUTCSeconds(epoch);

	return d;
};

export const formatDate = (dt: Date, incTime: boolean): string => {
	const fmt = incTime ? 'h:mma [on] ddd, MMM Do' : 'ddd, MMM Do';

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
	const BLUE = 0;
	let perc = point / max;
	let red = Math.round((1 - perc) * 510);
	let green = Math.round(510 * perc);
	let backgroundColor;

	green = green > 255 ? 255 : green;
	red = red > 255 ? 255 : red;
	backgroundColor = `rgb(${red}, ${green}, ${BLUE})`;

	return { backgroundColor };
};

export const getCurrentSeasonYear = (): number => {
	const currDate = new Date();
	const currMonth = currDate.getMonth();
	const currYear = currDate.getFullYear() - (currMonth < 2 ? 1 : 0);

	return currYear;
};

export const getInputColor = (
	error: boolean,
	touched: boolean,
	prefix: string,
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
	let days = Math.floor(delta / 86400);
	let hours;
	let minutes;
	let seconds;

	delta -= days * 86400;
	hours = Math.floor(delta / 3600) % 24;
	delta -= hours * 3600;
	minutes = Math.floor(delta / 60) % 60;
	delta -= minutes * 60;
	seconds = delta % 60;

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
	err: Error | Meteor.Error | Meteor.TypedError,
	opts: Partial<SwalOptions> = {},
	cb: (() => void) | null = null,
	hide = false,
): void => {
	if (!err) return;

	if (Meteor.isClient && !hide) {
		const sweetAlert = require('sweetalert');

		opts.title = opts.title || 'Error Occurred';
		opts.text = `${opts.text ||
			err.reason ||
			err.message ||
			err.error ||
			'Something went wrong, please try again'}`;
		opts.icon = opts.icon || 'error';

		sweetAlert(opts, cb);
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
	pointsSort: TSortResult,
	gamesSort: TSortResult,
	user1: TUser,
	user2: TUser,
): TSortResult => {
	if (pointsSort) {
		// @ts-ignore
		if (user1.total_points < user2.total_points) return -1 * pointsSort;

		if (user1.total_points > user2.total_points) return pointsSort;
	}

	if (gamesSort) {
		// @ts-ignore
		if (user1.total_games < user2.total_games) return -1 * gamesSort;

		if (user1.total_games > user2.total_games) return gamesSort;
	}

	return 0;
};

export const weekPlacer = (
	week: TWeek,
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
export const pad = (toPad: string | number, ln: number, padWith = '0'): string => {
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
