'use strict';

export const displayError = (err, opts = { title: err && err.reason, type: 'danger' }) => {
  if (!err) return;
console.log(err);
  if (!opts.title) opts.title = 'Missing error title!';
  Bert.alert(opts);
};