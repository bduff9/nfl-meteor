/*jshint esversion: 6 */
'use strict';

export const displayError = (err, opts = { title: err && err.reason, type: 'danger' }) => {
  if (!err) return;
console.log('displayError', err);
console.log('displayError', opts);
  if (!opts.title) opts.title = 'Missing error title!';
  Bert.alert(opts);
};

export const logError = (err) => {
  if (!err) return;
  console.error('Error from logError', err);
};

/* BD - Not currently using the below
export const convertShortName = (shortName) => {
  switch (shortName) {
  case 'NEP': return 'NE';
  case 'GBP': return 'GB';
  case 'TBB': return 'TB';
  case 'NOS': return 'NO';
  case 'KCC': return 'KC';
  case 'SDC': return 'SD';
  case 'SFO': return 'SF';
  default: return shortName;
  }
};
*/

export const convertEpoch = (epoch) => {
  let d = new Date(0);
  d.setUTCSeconds(epoch);
  return d;
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

export const formattedPlace = (place) => {
  const s = ['th', 'st', 'nd', 'rd'],
      v = place % 100;
  return place + (s[(v - 20) % 10] || s[v] || s[0]);
};

export const weekPlacer = (week, user1, user2) => {
  const tie1 = user1.tiebreakers[week - 1],
      tie2 = user2.tiebreakers[week - 1],
      lastScoreDiff1 = tie1.last_score - tie1.last_score_act,
      lastScoreDiff2 = tie2.last_score - tie2.last_score_act;
  // First, sort by points
  if (tie1.points_earned > tie2.points_earned) {
    return -1;
  } else if (tie1.points_earned < tie2.points_earned) {
    return 1;
  // Then, sort by games correct
  } else if (tie1.games_correct > tie2.games_correct) {
    return -1;
  } else if (tie1.games_correct > tie2.games_correct) {
    return 1;
  // Then, sort by whomever didn't go over the last game's score
  } else if (lastScoreDiff1 > 0 && lastScoreDiff2 < 0) {
    return -1;
  } else if (lastScoreDiff1 < 0 && lastScoreDiff2 > 0) {
    return 1;
  // Next, sort by the closer to the last games score
  } else if (Math.abs(lastScoreDiff1) < Math.abs(lastScoreDiff2)) {
    return -1;
  } else if (Math.abs(lastScoreDiff1) > Math.abs(lastScoreDiff2)) {
    return 1;
  // Finally, if we get here, then they are identical
  } else {
    return 0;
  }
};

export const overallPlacer = (user1, user2) => {
  // First, sort by points
  if (user1.total_points > user2.total_points) {
    return -1;
  } else if (user1.total_points < user2.total_points) {
    return 1;
  // Then, sort by games correct
  } else if (user1.total_games > user2.total_games) {
    return -1;
  } else if (user1.total_games > user2.total_games) {
    return 1;
  // Finally, if we get here, then they are identical
  } else {
    return 0;
  }
};
