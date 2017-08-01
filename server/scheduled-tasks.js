/* globals API */
'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { moment } from 'meteor/momentjs:moment';
import { SyncedCron } from 'meteor/percolate:synced-cron';
import { Email } from 'meteor/email';

import { getFirstGameOfWeekSync } from '../imports/api/collections/games';
import { getSystemValuesSync } from '../imports/api/collections/systemvals';
import { getUsersSync } from '../imports/api/collections/users';
import { currentWeekSync } from '../imports/api/collections/games';
import { refreshGamesSync } from './collections/games';

const CronHistory = SyncedCron._collection;

export const clearCronHistory = new ValidatedMethod({
	name: 'CronHistory.clearCronHistory',
	validate: new SimpleSchema({}).validator(),
	run () {
		CronHistory.remove({}, { multi: true });
	}
});
export const clearCronHistorySync = Meteor.wrapAsync(clearCronHistory.call, clearCronHistory);

// Config synced cron here
SyncedCron.config({
	log: false
});

SyncedCron.add({
	name: 'Update spread and ranks outside of games',
	schedule: parse => parse.recur().on(5, 17).hour(),
	job: () => API.updateGames()
});

SyncedCron.add({
	name: 'Update games every hour on the hour',
	schedule: parse => parse.recur().first().minute(),
	job: () => refreshGamesSync()
});

SyncedCron.add({
	name: 'Update games every minute when needed',
	schedule: parse => parse.recur().every(1).minute(),
	job: () => {
		const systemVals = getSystemValuesSync();
		if (systemVals.games_updating) return 'Games already updating, skipping every minute call';
		if (!systemVals.shouldUpdateFaster()) return 'No need to update games faster currently';
		return refreshGamesSync();
	}
});

SyncedCron.add({
	name: 'Send email notifications',
	schedule: parse => parse.recur().on(45).minute(),
	job: () => {
		const week = currentWeekSync(),
				users = getUsersSync({ activeOnly: true }),
				firstGameOfWeek = getFirstGameOfWeekSync({ week }),
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

This is just a friendly reminder that you have not submitted your picks yet for week ${week} and you now have less than 24 hours.  You can log in and submit your picks here:
http://nfl.asitewithnoname.com

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
