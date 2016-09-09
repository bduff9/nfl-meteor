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
        users = User.find({ "done_registering": true }).fetch(),
        firstGameOfWeek = Game.findOne({ week, game: 1 }),
        now = moment(),
        kickoff = moment(firstGameOfWeek.kickoff),
        timeToKickoff = kickoff.diff(now, 'hours', true);
    if (timeToKickoff > 23 && timeToKickoff <= 24) {
      users.forEach(user => {
        const tiebreaker = user.tiebreakers.filter(t => t.week === week)[0];
        if (!tiebreaker.submitted) {
          Email.send({
            to: user.email,
            from: 'Brian Duffey <bduff9@gmail.com>',
            subject: `[NFL Confidence Pool] Hurry up, ${user.first_name}!`,
            text: `Hello ${user.first_name},

This is just a friendly reminder that you have not submitted your picks yet for week ${week} and you now have less than 24 hours.  You can log in and submit your picks here: http://nfl.asitewithnoname.com

Good luck!`,
          });
          console.log(`Email sent to ${user.first_name} ${user.last_name} (${user.email})`);
        }
      });
    }
    return `Email task run for ${users.length} users`;
  }
});

Meteor.startup(() => {
  SyncedCron.start();
});
