/*jshint esversion: 6 */
'use strict';

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Session } from 'meteor/session';

import '/imports/ui/pages/main.html';
import '/imports/startup/client';
import 'bootstrap';

import { writeLog } from '../imports/api/collections/nfllogs';
import { currentWeek } from '../imports/api/collections/games';
import { displayError } from '../imports/api/global';

Meteor.startup(() => {

  Accounts.onLogin(() => {
    const user = Meteor.user();
    writeLog.call({ userId: user._id, action: 'LOGIN', message: `${user.first_name} ${user.last_name} successfully signed in` }, displayError);
    currentWeek.call((err, week) => {
      if (err) {
        displayError(err);
      } else {
        Session.set('currentWeek', week);
        Session.set('selectedWeek', week);
      }
    });
  });

});
