import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import React, { FC, memo, useEffect } from 'react';
import Helmet from 'react-helmet';
import { NavLink } from 'react-router-dom';

import { writeLog } from '../../api/collections/nfllogs';
import { removeSelectedWeek } from '../../api/collections/users';
import { TError } from '../../api/commonTypes';
import { handleError } from '../../api/global';

const Logout: FC<{}> = (): JSX.Element => {
	useEffect((): void => {
		// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
		// @ts-ignore
		const user: TUser | null = Meteor.user();
		const userId = Meteor.userId();

		if (userId) {
			removeSelectedWeek.call({ userId });

			Meteor.logout(
				(err: TError): void => {
					if (err) {
						handleError(err);

						return;
					}

					writeLog.call(
						{
							userId,
							action: 'LOGOUT',
							message: `${user.first_name} ${
								user.last_name
							} successfully signed out`,
						},
						handleError,
					);
					// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
					// @ts-ignore
					Object.keys(Session.keys).forEach(
						(key): void => Session.set(key, undefined),
					);
					// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
					// @ts-ignore
					Session.keys = {};
				},
			);
		}
	}, []);

	return (
		<div className="white-box col-11 col-sm-10 col-md-6 col-xl-4 logout-box">
			<Helmet title="Logged Out" />
			<div className="row">
				<div className="text-center col">
					<h3>You have been successfully logged out</h3>
				</div>
			</div>
			<div className="row">
				<div className="text-center col">
					<NavLink to="/login">Return to Sign-in</NavLink>
				</div>
			</div>
		</div>
	);
};

Logout.whyDidYouRender = true;

export default memo(Logout);
