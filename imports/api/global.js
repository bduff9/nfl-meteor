'use strict';

import { Bert } from 'meteor/themeteorchef:bert';

export const convertEpoch = (epoch) => {
	let d = new Date(0);
	d.setUTCSeconds(epoch);
	return d;
};

export const displayError = (err, opts = { title: err && err.reason, type: 'danger' }) => {
	if (!err) return;
	if (!opts.title) opts.title = 'Missing error title!';
	console.error(err);
	Bert.alert(opts);
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

export const formattedPlace = (place) => {
	const s = ['th', 'st', 'nd', 'rd'],
			v = place % 100;
	return place + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const logError = (err) => {
	if (!err) return;
	console.error('Error from logError', err);
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
