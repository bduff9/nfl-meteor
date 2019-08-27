import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import React, { FC } from 'react';
import { NavLink, RouteComponentProps } from 'react-router-dom';
import Helmet from 'react-helmet';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { TError } from '../../api/commonTypes';

import Loading from './Loading';

export type TQuickPickProps = {
	isError: boolean;
	msg: string;
	pageReady: boolean;
};

const QuickPick: FC<TQuickPickProps> = ({
	isError,
	msg,
	pageReady,
}): JSX.Element => {
	const pageTitle = 'Quick Pick';

	return (
		<div className="row quick-pick">
			{pageReady ? (
				<div className="white-box col-11 col-sm-10 col-md-6">
					<Helmet title={pageTitle} />
					<div className="row">
						<div className="col-12">
							<h3 className="title-text text-center">{pageTitle}</h3>
						</div>
					</div>
					<div className="row">
						<div className="col-12 quick-pick-message">
							{isError ? (
								<FontAwesomeIcon
									className="text-danger"
									icon={['fad', 'exclamation-triangle']}
									fixedWidth
									size="2x"
								/>
							) : (
								<FontAwesomeIcon
									className="text-success"
									icon={['fad', 'thumbs-up']}
									fixedWidth
									size="2x"
								/>
							)}
							{msg}
						</div>
						<div className="col-12">
							<ul>
								<li>
									<NavLink to="/">Go Home</NavLink>
								</li>
								{!isError && (
									<li>
										<NavLink to="/picks/set">Continue making picks</NavLink>
									</li>
								)}
							</ul>
						</div>
					</div>
				</div>
			) : (
				<Loading />
			)}
		</div>
	);
};

QuickPick.whyDidYouRender = true;

export default withTracker<
	TQuickPickProps,
	RouteComponentProps<{ team_short: string; user_id: string }>
>(
	({ match }): TQuickPickProps => {
		// eslint-disable-next-line @typescript-eslint/camelcase
		const { team_short, user_id } = match.params;
		const currentUserID = Meteor.userId();
		// eslint-disable-next-line @typescript-eslint/camelcase
		const sessionKey = `quick-pick-${user_id}-${team_short}`;
		const SUCCESS_MSG =
			'You have successfully made your game 1 pick!  Please be sure to set the rest of your picks and then submit them for this week.';
		let msg = Session.get(sessionKey);
		let isError = false;

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (currentUserID && currentUserID !== user_id) {
			msg = "Error!  You cannot set someone else's picks!";
			isError = true;
		} else if (!msg) {
			Meteor.call(
				'Picks.doQuickPick',
				// eslint-disable-next-line @typescript-eslint/camelcase
				{ team_short, user_id },
				(err: TError, result: string): void =>
					// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
					// @ts-ignore
					Session.set(sessionKey, err ? err.reason : result),
			);
		} else {
			if (msg === true) {
				msg = SUCCESS_MSG;
				isError = false;
			} else {
				isError = true;
			}
		}

		return {
			isError,
			msg,
			pageReady: !!msg,
		};
	},
)(QuickPick);
