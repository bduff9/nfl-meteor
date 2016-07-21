'use strict';

export const displayError = (err, opts = { title: err && err.reason, type: 'danger' }) => {
  if (!err) return;
  if (!opts.title) opts.title = 'Missing error title!';
  Bert.alert(opts);
};

export const logError = (err) => {
  if (!err) return;
  console.error('Error from logError', err);
};

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