import { differenceInHours } from 'date-fns';
import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { ValidatedMethod } from 'meteor/mdg:validated-method';
import { Meteor } from 'meteor/meteor';
import { SyncedCron } from 'meteor/percolate:synced-cron';

import {
	getNextGame1,
	getUnstartedGamesForWeek,
	TGame,
} from '../imports/api/collections/games';
import {
	getPickForFirstGameOfWeek,
	TPick,
} from '../imports/api/collections/picks';
import {
	getSystemValues,
	TSystemVals,
} from '../imports/api/collections/systemvals';
import {
	getUnsubmittedPicksForWeek,
	TTiebreaker,
} from '../imports/api/collections/tiebreakers';
import { TError } from '../imports/api/commonTypes';
import { EMAIL_SUBJECT_PREFIX, MAX_SMS_LENGTH } from '../imports/api/constants';
import { handleError } from '../imports/api/global';

//TODO: remove commented lines once confirmed to work
//import { updateGames } from './api-calls';
import { refreshGames } from './collections/games';
import { sendEmail } from './emails/email';
import { sendSMS } from './twilio';

export const clearCronHistory = new ValidatedMethod({
	name: 'CronHistory.clearCronHistory',
	validate: new SimpleSchema({}).validator(),
	run (): void {
		SyncedCron._collection.remove({});
	},
});
export const clearCronHistorySync = Meteor.wrapAsync(
	clearCronHistory.call,
	clearCronHistory,
);

// Config synced cron here
SyncedCron.config({
	log: false,
});

// Commented out since refreshGames below now calls updateGames if no games in progress
// SyncedCron.add({
// 	name: 'Update spread and ranks outside of games',
// 	schedule: (parse): void =>
// 		parse
// 			.recur()
// 			.on(5, 17)
// 			.hour(),
// 	job: () => updateGames(),
// });

SyncedCron.add({
	name: 'Update games every hour on the hour',
	schedule: (parse: later.ParseStatic): later.RecurrenceBuilder =>
		parse
			.recur()
			.first()
			.minute(),
	job: () => refreshGames.call({}),
});

SyncedCron.add({
	name: 'Update games every minute when needed',
	schedule: (parse: later.ParseStatic): later.RecurrenceBuilder =>
		parse
			.recur()
			.every(1)
			.minute(),
	job: () => {
		const systemVals = (getSystemValues.call({}) as unknown) as TSystemVals;

		if (systemVals.games_updating)
			return 'Games already updating, skipping every minute call';

		if (!systemVals.shouldUpdateFaster())
			return 'No need to update games faster currently';

		return refreshGames.call({});
	},
});

SyncedCron.add({
	name: 'Send notifications',
	schedule: (parse: later.ParseStatic): later.RecurrenceBuilder =>
		parse
			.recur()
			.on(30)
			.minute(),
	job: () => {
		const POOL_URL = Meteor.settings.baseURL;
		const nextGame1 = (getNextGame1.call({}) as unknown) as TGame;
		const { kickoff, week } = nextGame1;
		const homeTeam = nextGame1.getTeam('home');
		const visitingTeam = nextGame1.getTeam('visitor');
		const rawTimeToKickoff = differenceInHours(kickoff, new Date());
		const upperLimit = Math.round(rawTimeToKickoff * 2) / 2;
		const lowerLimit = upperLimit - 1;
		let unstartedGames = [];

		if (week > 1)
			unstartedGames = (getUnstartedGamesForWeek.call({
				week: week - 1,
			}) as unknown) as TGame[];

		if (unstartedGames.length) return;

		const notSubmitted = (getUnsubmittedPicksForWeek.call({
			week,
		}) as unknown) as TTiebreaker[];

		notSubmitted.forEach(
			(tb): void => {
				const { league } = tb;
				const user = tb.getUser();
				const {
					_id,
					email,
					// eslint-disable-next-line @typescript-eslint/camelcase
					first_name,
					// eslint-disable-next-line @typescript-eslint/camelcase
					last_name,
					notifications,
					// eslint-disable-next-line @typescript-eslint/camelcase
					phone_number,
				} = user;

				notifications.forEach(
					(notification): void => {
						// eslint-disable-next-line @typescript-eslint/camelcase
						const { hours_before, is_quick, type } = notification;

						// eslint-disable-next-line @typescript-eslint/camelcase
						if (hours_before <= lowerLimit || hours_before > upperLimit) return;

						// eslint-disable-next-line @typescript-eslint/camelcase
						if (is_quick) {
							const pick1 = (getPickForFirstGameOfWeek.call({
								league,
								// eslint-disable-next-line @typescript-eslint/camelcase
								user_id: _id,
								week,
							}) as unknown) as TPick;

							if (!pick1.pick_id || !pick1.pick_short || !pick1.points) {
								sendEmail.call(
									{
										data: {
											// eslint-disable-next-line @typescript-eslint/camelcase
											hours: hours_before,
											preview:
												'This is an automated email to allow you one-click access to make your pick for the first game of the week',
											team1: homeTeam,
											team2: visitingTeam,
											user,
											week,
										},
										// eslint-disable-next-line @typescript-eslint/camelcase
										subject: `Time's almost up, ${first_name}!`,
										template: 'quickPick',
										to: email,
									},
									(err: TError): void => {
										if (err) {
											handleError(err);
										} else {
											console.log(
												// eslint-disable-next-line @typescript-eslint/camelcase
												`Sent quick pick email to ${first_name} ${last_name}!`,
											);
										}
									},
								);
							}
						} else {
							if (type.indexOf('email') > -1) {
								sendEmail.call(
									{
										data: {
											// eslint-disable-next-line @typescript-eslint/camelcase
											hours: hours_before,
											preview:
												"Don't lose out on points this week, act now to submit your picks!",
											user,
											week,
										},
										// eslint-disable-next-line @typescript-eslint/camelcase
										subject: `Hurry up, ${first_name}!`,
										template: 'reminder',
										to: email,
									},
									(err: TError): void => {
										if (err) {
											handleError(err);
										} else {
											console.log(
												// eslint-disable-next-line @typescript-eslint/camelcase
												`Sent reminder email to ${first_name} ${last_name}!`,
											);
										}
									},
								);
							}

							if (type.indexOf('text') > -1) {
								// eslint-disable-next-line @typescript-eslint/camelcase
								let msg = `${EMAIL_SUBJECT_PREFIX}${first_name}, this is your reminder to submit your picks for week ${week} as you now have less than ${hours_before} hours!`;

								if (msg.length + POOL_URL.length < MAX_SMS_LENGTH)
									msg += ` ${POOL_URL}`;

								sendSMS(
									// eslint-disable-next-line @typescript-eslint/camelcase
									`+1${phone_number}`,
									msg,
									(err: Error | null): void => {
										if (err === null) {
											console.log(
												// eslint-disable-next-line @typescript-eslint/camelcase
												`Sent reminder text to ${first_name} ${last_name}!`,
											);
										}
									},
								);
							}
						}
					},
				);
			},
		);

		return `Email task run for ${notSubmitted.length} users`;
	},
});

Meteor.startup((): void => SyncedCron.start());
