'use strict';

export const displayError = (title, message, type = 'danger', icon) => {
  let opts = { title, type };
  if (message) opts.message = message;
  if (icon) opts.icon = icon;
  Bert.alert(opts);
};