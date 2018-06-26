'use strict';

import { Meteor } from 'meteor/meteor';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { moment } from 'meteor/momentjs:moment';
import { SyncedCron } from 'meteor/percolate:synced-cron';

import { EMAIL_SUBJECT_PREFIX, MAX_SMS_LENGTH } from '../imports/api/constants';
import { handleError } from '../imports/api/global';
import { updateGames } from './api-calls';
import { sendSMS } from './twilio';
import { sendEmail } from './emails/email';
import { getNextGame1, getUnstartedGamesForWeek } from '../imports/api/collections/games';
import { refreshGames } from './collections/games';
import { getPickForFirstGameOfWeek } from '../imports/api/collections/picks';
import { getSystemValues } from '../imports/api/collections/systemvals';
import { getUnsubmittedPicksForWeek } from '../imports/api/collections/tiebreakers';

export const clearCronHistory = new ValidatedMethod({
	name: 'CronHistory.clearCronHistory',
	validate: new SimpleSchema({}).validator(),
	run () {
		SyncedCron._collection.remove({});
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
	job: () => updateGames()
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
		const POOL_URL = Meteor.settings.baseURL;
		const nextGame1 = getNextGame1.call({});
		const { kickoff, week } = nextGame1;
		const homeTeam = nextGame1.getTeam('home');
		const visitingTeam = nextGame1.getTeam('visitor');
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
			const { _id, email, first_name, last_name, notifications, phone_number } = user;

			notifications.forEach(notification => {
				const { hours_before, is_quick, type } = notification;

				if (hours_before <= lowerLimit || hours_before > upperLimit) return;

				if (is_quick) {
					const pick1 = getPickForFirstGameOfWeek.call({ league, user_id: _id, week });

					if (!pick1.pick_id || !pick1.pick_short || !pick1.points) {
						sendEmail.call({ data: { hours: hours_before, preview: 'This is an automated email to allow you one-click access to make your pick for the first game of the week', team1: homeTeam, team2: visitingTeam, user, week }, subject: `Time's almost up, ${first_name}!`, template: 'quickPick', to: email }, err => {
							if (err) {
								handleError(err);
							} else {
								console.log(`Sent quick pick email to ${first_name} ${last_name}!`);
							}
						});
					}
				} else {
					if (type.indexOf('email') > -1) {
						sendEmail.call({ data: { hours: hours_before, preview: 'Don\'t lose out on points this week, act now to submit your picks!', user, week }, subject: `Hurry up, ${first_name}!`, template: 'reminder', to: email }, err => {
							if (err) {
								handleError(err);
							} else {
								console.log(`Sent reminder email to ${first_name} ${last_name}!`);
							}
						});
					}
					if (type.indexOf('text') > -1) {
						let msg = `${EMAIL_SUBJECT_PREFIX}${first_name}, this is your reminder to submit your picks for week ${week} as you now have less than ${hours_before} hours!`;

						if ((msg.length + POOL_URL.length) < MAX_SMS_LENGTH) msg += ` ${POOL_URL}`;

						sendSMS(`+1${phone_number}`, msg, err => {
							console.log(`Sent reminder text to ${first_name} ${last_name}!`);
						});
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
