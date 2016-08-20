/*jshint esversion: 6 */
'use strict';

import { moment } from 'meteor/momentjs:moment';

import { Game, User } from '../imports/api/schema';
import { currentWeek, refreshGames } from '../imports/api/collections/games';

SyncedCron.add({
  name: 'Update games every hour on the hour',
  schedule: parse => parse.recur().first().minute(),
  job: () => refreshGames.call()
});

SyncedCron.add({
  name: 'Send email notifications',
  schedule: parse => parse.recur().on(30).minute(),
  job: () => {
    const week = currentWeek.call(),
        users = User.find({ "tiebreakers.week": week, "tiebreakers.submitted": false }).fetch(),
        firstGameOfWeek = Game.findOne({ week, game: 1 }),
        now = moment(),
        kickoff = moment(firstGameOfWeek.kickoff),
        timeToKickoff = kickoff.diff(now, 'hours', true);
    if (timeToKickoff >= 23 && timeToKickoff < 24) {
      users.forEach(user => {
        Email.send({
          to: user.email,
          from: 'Brian Duffey <bduff9@gmail.com>',
          subject: `Hurry up, ${user.first_name}!`,
          text: `Hello ${user.first_name},

          This is just a friendly reminder that you have not submitted your picks yet for week ${week} and you now have less than 24 hours.

          Good luck!`,
        });
        console.log(`Email sent to ${user.email}`);
      });
    }
    return 'TODO: Email task run';
  }
});

Meteor.startup(() => {
  SyncedCron.start();
});
