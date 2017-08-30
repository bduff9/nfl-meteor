'use strict';

import { Meteor } from 'meteor/meteor';
import { moment } from 'meteor/momentjs:moment';

export const convertEpoch = epoch => {
	let d = new Date(0);
	d.setUTCSeconds(epoch);
	return d;
};
export const formatDate = (dt, incTime) => {
	const fmt = (incTime ? 'h:mma [on] ddd, MMM Do' : 'ddd, MMM Do');
	return moment(dt).format(fmt);
};

export const formattedPlace = place => {
	const s = ['th', 'st', 'nd', 'rd'],
			v = place % 100;
	return place + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const getColor = (point, max) => {
	const BLUE = 0;
	let style = {},
			perc = point / max,
			red = parseInt((1 - perc) * 510, 10),
			green = parseInt(510 * perc, 10);
	green = (green > 255 ? 255 : green);
	red = (red > 255 ? 255 : red);
	style.backgroundColor = `rgb(${red}, ${green}, ${BLUE})`;
	return style;
};

export const getCurrentSeasonYear = () => {
	const currDate = new Date(),
			currMonth = currDate.getMonth(),
			currYear = currDate.getFullYear() - (currMonth < 2 ? 1 : 0);
	return currYear;
};

export const getInputColor = (error, touched, prefix) => {
	if (!touched) return '';
	if (error) return prefix + 'danger';
	return prefix + 'success';
};

export const handleError = (err, opts = {}, cb = null, hide = false) => {
	if (!err) return;
	if (Meteor.isClient && !hide) {
		const sweetAlert = require('sweetalert');
		opts.title = opts.title || 'Error Occurred';
		opts.text = opts.text || err.reason || err.message || err.error || 'Something went wrong, please try again';
		opts.type = opts.type || 'error';
		sweetAlert(opts, cb);
	} else {
		console.error(opts.title || 'Caught error', err);
		if (cb) cb();
	}
};

export const sortForDash = (pointsSort, gamesSort, user1, user2) => {
	if (pointsSort) {
		if (user1.total_points < user2.total_points) return -1 * pointsSort;
		if (user1.total_points > user2.total_points) return pointsSort;
	}
	if (gamesSort) {
		if (user1.total_games < user2.total_games) return -1 * gamesSort;
		if (user1.total_games > user2.total_games) return gamesSort;
	}
	return 0;
};

export const weekPlacer = (week, user1, user2) => {
	const lastScoreDiff1 = user1.last_score - user1.last_score_act,
			lastScoreDiff2 = user2.last_score - user2.last_score_act;
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

export const overallPlacer = (user1, user2) => {
	// First, sort by points
	if (user1.total_points > user2.total_points) return -1;
	if (user1.total_points < user2.total_points) return 1;
	// Then, sort by games correct
	if (user1.total_games > user2.total_games) return -1;
	if (user1.total_games < user2.total_games) return 1;
	// Finally, if we get here, then they are identical
	return 0;
};

export const pad = (toPad, ln, padWith = '0') => {
	let padded = '' + toPad;
	while (padded.length < ln) padded = '' + padWith + padded;
	return padded;
};
