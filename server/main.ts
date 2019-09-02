import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import * as yup from 'yup';

import { currentWeek } from '../imports/api/collections/games';
import { writeLog } from '../imports/api/collections/nfllogs';
import { getSystemValues } from '../imports/api/collections/systemvals';
import { POOL_COST } from '../imports/api/constants';
import { handleError } from '../imports/api/global';
import { TUser } from '../imports/api/collections/users';

const gmailUrl = Meteor.settings.private.gmail;

const updateUserIfNeeded = (
	user: TUser & Meteor.User,
	field: string,
	newValue: any,
): void => {
	// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
	// @ts-ignore
	const oldValue = user[field];

	if (oldValue != null && oldValue !== '') return;

	if (newValue == null) return;

	// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
	// @ts-ignore
	user[field] = newValue;
};

Meteor.startup(
	(): void => {
		process.env.MAIL_URL = gmailUrl;

		Meteor.onConnection(
			(conn: Meteor.Connection): void => {
				const systemVals = getSystemValues.call({});
				const newConn = {
					opened: new Date(),
					// eslint-disable-next-line @typescript-eslint/camelcase
					on_view_my_picks: false,
					// eslint-disable-next-line @typescript-eslint/camelcase
					on_view_all_picks: false,
					// eslint-disable-next-line @typescript-eslint/camelcase
					scoreboard_open: false,
				};

				systemVals.current_connections[conn.id] = newConn;
				systemVals.save();

				conn.onClose(
					(): void => {
						delete systemVals.current_connections[conn.id];

						systemVals.save();
					},
				);
			},
		);

		Accounts.onCreateUser(
			// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
			// @ts-ignore
			(options: any, user: TUser): TUser => {
				const currWeek = currentWeek.call({});
				const EMPTY_VAL = '';
				const profile = options.profile || {};
				const emailSchema = yup
					.string()
					.email()
					.required();
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				let existingUser: TUser | undefined = Meteor.user();
				let verified = true;
				let email;
				let firstName;
				let lastName;
				let service;

				if (currWeek > 3) {
					throw new Meteor.Error(
						'Registration has ended',
						'No new users are allowed after the third week.  Please try again next year',
					);
				}

				if (user.services.facebook) {
					firstName = user.services.facebook.first_name;
					lastName = user.services.facebook.last_name;
					email = user.services.facebook.email;
					service = 'facebook';
				} else if (user.services.google) {
					firstName = user.services.google.given_name;
					lastName = user.services.google.family_name;
					email = user.services.google.email;
					service = 'google';
				} else {
					firstName = EMPTY_VAL;
					lastName = EMPTY_VAL;
					// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
					// @ts-ignore
					email = options.email;
					service = 'password';
					verified = false;
				}

				if (!emailSchema.isValidSync(email)) {
					throw new Meteor.Error(
						'Invalid email found',
						`A valid email is required to register, however, the email '${email}' was given.  Please try again, or if you think this is incorrect, contact the admin`,
					);
				}

				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				if (!existingUser) existingUser = Meteor.users.findOne({ email });

				if (existingUser) {
					existingUser.services = existingUser.services || {};
					existingUser.services[service] = user.services[service];
					Meteor.users.remove({ _id: existingUser._id });
					user = existingUser;
				}

				updateUserIfNeeded(user, 'profile', profile);
				updateUserIfNeeded(user, 'email', email);
				updateUserIfNeeded(user, 'phone_number', '');
				updateUserIfNeeded(user, 'first_name', firstName);
				updateUserIfNeeded(user, 'last_name', lastName);
				updateUserIfNeeded(user, 'verified', verified);
				updateUserIfNeeded(user, 'done_registering', false);
				updateUserIfNeeded(user, 'is_admin', false);
				updateUserIfNeeded(user, 'notifications', []);
				updateUserIfNeeded(user, 'team_name', EMPTY_VAL);
				updateUserIfNeeded(user, 'referred_by', EMPTY_VAL);
				updateUserIfNeeded(user, 'leagues', []);
				updateUserIfNeeded(user, 'survivor', null);
				updateUserIfNeeded(user, 'payment_type', EMPTY_VAL);
				updateUserIfNeeded(user, 'payment_account', EMPTY_VAL);
				updateUserIfNeeded(user, 'owe', POOL_COST);
				updateUserIfNeeded(user, 'paid', 0);
				updateUserIfNeeded(user, 'selected_week', {});
				updateUserIfNeeded(user, 'total_points', 0);
				updateUserIfNeeded(user, 'total_games', 0);
				updateUserIfNeeded(user, 'overall_place', 1);
				updateUserIfNeeded(user, 'overall_tied_flag', true);

				firstName = firstName || 'An unknown';
				lastName = lastName || 'user';

				writeLog.call(
					{
						userId: user._id,
						action: 'REGISTER',
						message: `${firstName} ${lastName} registered with email ${email}`,
					},
					handleError,
				);

				return user;
			},
		);

		Accounts.validateLoginAttempt(
			({
				allowed,
				methodName,
				user,
			}: {
				allowed: boolean;
				methodName: string;
				user: Meteor.User & TUser;
			}): boolean => {
				const currWeek = currentWeek.call({});
				let vEmails;

				if (!allowed || !user) return false;

				if (methodName === 'createUser') {
					// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
					// @ts-ignore
					Accounts.sendVerificationEmail(user._id);

					return false;
				}

				if (!user.verified) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
					// @ts-ignore
					vEmails = user.emails.filter((email): boolean => email.verified);

					// Should we also re-send the verification email here?
					if (vEmails.length === 0)
						throw new Meteor.Error(
							'Email not verified!',
							'Please check your email to verify your account',
						);

					Meteor.users.update({ _id: user._id }, { $set: { verified: true } });

					return true;
				}

				if (!user.done_registering && currWeek > 3)
					throw new Meteor.Error(
						'Registration has ended',
						'No new users are allowed after the third week.  Please try again next year',
					);

				return true;
			},
		);
	},
);
