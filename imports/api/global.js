'use strict';

export const displayError = (err, opts = { title: err && err.reason, type: 'danger' }) => {
  if (!err) return;
  if (!opts.title) opts.title = 'Missing error title!';
  Bert.alert(opts);
};