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
