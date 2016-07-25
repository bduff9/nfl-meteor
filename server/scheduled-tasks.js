/*jshint esversion: 6 */
'use strict';

import { refreshGames } from '../imports/api/collections/games';
import { logError } from '../imports/api/global';

SyncedCron.add({
  name: 'Update games every hour on the hour',
  schedule: parse => parse.recur().first().minute(),
  job: () => refreshGames.call(logError)
});

SyncedCron.add({
  name: 'Send email notifications',
  schedule: parse => parse.recur().on(30).minute(),
  job: () => console.log('TODO: Email task run')
});

Meteor.startup(() => {
  SyncedCron.start();
});
