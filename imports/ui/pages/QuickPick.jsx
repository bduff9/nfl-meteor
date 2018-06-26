'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { Session } from 'meteor/session';
import { withTracker } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { Loading } from './Loading.jsx';

const QuickPick = ({ isError, msg, pageReady }) => {
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
							{isError ? <i className="fa fa-fw fa-2x fa-exclamation-triangle text-danger"></i> : <i className="fa fa-fw fa-2x fa-thumbs-up text-success"></i>}
							{msg}
						</div>
						<div className="col-12">
							<ul>
								<li><NavLink to="/">Go Home</NavLink></li>
								{isError ? null : <li><NavLink to="/picks/set">Continue making picks</NavLink></li>}
							</ul>
						</div>
					</div>
				</div>
			)
				:
				<Loading />
			}
		</div>
	);
};

QuickPick.propTypes = {
	isError: PropTypes.bool.isRequired,
	msg: PropTypes.string,
	pageReady: PropTypes.bool.isRequired
};

export default withTracker(({ params }) => {
	/*
	TODO: will need to rework this component with react router 4 since the onEnter prop was taken off Route in Routes.jsx, this is to ensure the quick pick works the first time as well as if you were to come back (like after an error)

	function clearOldQuickPick (nextState, replace) {
		const { params } = nextState,
				{ team_short, user_id } = params;
		Session.set(`quick-pick-${user_id}-${team_short}`, null);
	}
	*/
	const { team_short, user_id } = params,
			currentUserID = Meteor.userId(),
			sessionKey = `quick-pick-${user_id}-${team_short}`,
			SUCCESS_MSG = 'You have successfully made your game 1 pick!  Please be sure to set the rest of your picks and then submit them for this week.';
	let msg = Session.get(sessionKey),
			isError = false;
	if (currentUserID && currentUserID !== user_id) {
		msg = 'Error!  You cannot set someone else\'s picks!';
		isError = true;
	} else if (!msg) {
		Meteor.call('Picks.doQuickPick', { team_short, user_id }, (err, result) => Session.set(sessionKey, (err ? err.reason : result)));
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
		pageReady: !!msg
	};
})(QuickPick);
