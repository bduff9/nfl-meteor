/* globals API */
'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { moment } from 'meteor/momentjs:moment';
import { SyncedCron } from 'meteor/percolate:synced-cron';
import { Email } from 'meteor/email';

import { getNextGame1, getUnstartedGamesForWeek } from '../imports/api/collections/games';
import { refreshGames } from './collections/games';
import { getPickForFirstGameOfWeek } from '../imports/api/collections/picks';
import { getSystemValues } from '../imports/api/collections/systemvals';
import { getUnsubmittedPicksForWeek } from '../imports/api/collections/tiebreakers';

const CronHistory = SyncedCron._collection;
// Currently, this does not work as I cannot get access to the original collection
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
	job: () => refreshGames.call({})
});

SyncedCron.add({
	name: 'Update games every minute when needed',
	schedule: parse => parse.recur().every(1).minute(),
	job: () => {
		const systemVals = getSystemValues.call({});
		if (systemVals.games_updating) return 'Games already updating, skipping every minute call';
		if (!systemVals.shouldUpdateFaster()) return 'No need to update games faster currently';
		return refreshGames.call({});
	}
});

SyncedCron.add({
	name: 'Send notifications',
	schedule: parse => parse.recur().on(30).minute(),
	job: () => {
		/**
		 * TODO:
		 */
		const nextGame1 = getNextGame1.call({});
		const { kickoff, week } = nextGame1;
		const rawTimeToKickoff = moment(kickoff).diff(moment(), 'hours', true);
		const upperLimit = (Math.round(rawTimeToKickoff * 2) / 2);
		const lowerLimit = upperLimit - 1;
		let unstartedGames = [];
		if (week > 1) unstartedGames = getUnstartedGamesForWeek.call({ week: week - 1 });
		if (unstartedGames.length) return;
		let notSubmitted = getUnsubmittedPicksForWeek.call({ week });
		notSubmitted.forEach(tb => {
			const { league } = tb;
			const user = tb.getUser();
			const { notifications } = user;
			notifications.forEach(notification => {
				const { hours_before, is_quick, type } = notification;
				if (hours_before <= lowerLimit || hours_before > upperLimit) return;
				if (is_quick) {
					const pick1 = getPickForFirstGameOfWeek.call({ league, user_id: user._id, week });
					if (!pick1.pick_id || !pick1.pick_short || !pick1.points) {
						console.log('TODO: send out quick pick email to this user');
						console.log(`Sent quick pick email to ${user.first_name} ${user.last_name}!`);
					}
				} else {
					if (type.indexOf('email') > -1) {
						console.log('TODO: send out email reminder');
						console.log(`Sent reminder email to ${user.first_name} ${user.last_name}!`);
					}
					if (type.indexOf('text') > -1) {
						console.log('TODO: send out text reminder');
						console.log(`Sent reminder text to ${user.first_name} ${user.last_name}!`);
					}
				}
			});
		});
		return `Email task run for ${notSubmitted.length} users`;
	}
});

Meteor.startup(() => {
	SyncedCron.start();
});


/**
 * Old email logic

Email.send({
	to: user.email,
	from: 'Brian Duffey <bduff9@gmail.com>',
	subject: `[NFL Confidence Pool] Hurry up, ${user.first_name}!`,
	text: `Hello ${user.first_name},

This is just a friendly reminder that you have not submitted your picks yet for week ${week} and you now have less than 24 hours.  You can log in and submit your picks here:
http://nfl.asitewithnoname.com

Good luck!`,
});
*/
