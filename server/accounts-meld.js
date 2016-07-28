'use strict';

import { NFLLog, User } from '../imports/api/schema';

const meldUserCallback = (origUser, newUser) => {
  const meldedUser = Object.assign({}, newUser, origUser);
  return meldedUser;
};

const meldDBCallback = (origUserId, newUserId) => {
  NFLLog.update({ user_id: origUserId }, { $set: { user_id: newUserId }}, { multi: true });
};

//TODO rewrite this using vanilla user object
const serviceAddedCallback = (user_id, service_name) => {
  const user = User.findOne(user_id);
  let firstName = user.first_name,
      lastName = user.last_name,
      fullName = user.profile && user.profile.name;
  if (service_name === 'facebook') {
    firstName = firstName || user.services.facebook.first_name;
    lastName = lastName || user.services.facebook.last_name;
    fullName = fullName || `${firstName} ${lastName}`;
  } else if (service_name === 'google') {
    firstName = firstName || user.services.google.given_name;
    lastName = lastName || user.services.google.family_name;
    fullName = fullName || `${firstName} ${lastName}`;
  }
  user.first_name = firstName;
  user.last_name = lastName;
  user.profile.name = fullName;
  user.save();
};

AccountsMeld.configure({
  askBeforeMeld: false,
  checkForConflictingServices: false,
  meldUserCallback,
  meldDBCallback,
  serviceAddedCallback
});
