import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import '/imports/ui/pages/main.html';
import '/imports/startup/client';
import 'bootstrap';

import { currentWeek } from '../imports/api/collections/games';
import { writeLog } from '../imports/api/collections/nfllogs';
import { TUser } from '../imports/api/collections/users';
import { TWeek } from '../imports/api/commonTypes';
import { handleError } from '../imports/api/global';

Meteor.startup(
	(): void => {
		Accounts.onLogin(
			(): void => {
				// @ts-ignore
				const user: TUser | null = Meteor.user();

				if (!user) return;

				if (user.first_name && user.last_name)
					writeLog.call(
						{
							userId: user._id,
							action: 'LOGIN',
							message: `${user.first_name} ${
								user.last_name
							} successfully signed in`,
						},
						handleError,
					);

				currentWeek.call(
					(err: Meteor.Error, week: TWeek): void => {
						if (err) {
							handleError(err);
						} else {
							Session.set('currentWeek', week);
						}
					},
				);
			},
		);
	},
);
