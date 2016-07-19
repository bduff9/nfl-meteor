'use strict';

import { NFLLog } from '../imports/api/collections';

const meldDBCallback = (origUserId, newUserId) => {
  NFLLog.update({ user_id: origUserId }, { $set: { user_id: newUserId }}, { multi: true });
};

AccountsMeld.configure({
  askBeforeMeld: false,
  checkForConflictingServices: false,
  meldDBCallback: meldDBCallback
});