'use strict';

import { Meteor } from 'meteor/meteor';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import Helmet from 'react-helmet';

const QuickPick = ({ params }) => {
	const pageTitle = 'Quick Pick',
			{ game_id, team_id, user_id } = params,
			currentUserID = Meteor.userId();
	let isError = false,
			msg;

	if (currentUserID && currentUserID !== user_id) {
		msg = 'Error!  You cannot set someone else\'s picks!';
		isError = true;
	} else {
	/**
	 * TODO: Probably easiest to do the following on the server, so set up a meteor.call that waits for the following:
	 * If game id is not next game 1, or if team id is not in next game 1, or if user has already made game 1 pick (for all leagues he is in), show error
	 * Get team short and highest unused point for each league, then set pick id, short and points
	 * Show success message and nav options (dashboard or make picks)
	 */
	}

	return (
		<div className="row quick-pick">
			<Helmet title={pageTitle} />
			<div className="white-box col-xs-11 col-sm-10 col-md-6">
				<div className="row">
					<div className="col-xs-12">
						<h3 className="title-text text-xs-center">{pageTitle}</h3>
					</div>
				</div>
				<div className="row">
					<div className="col-xs-12">
						{isError ? <i className="fa fa-fw fa-2x fa-exclamation-triangle text-danger"></i> : <i className="fa fa-fw fa-2x fa-thumbs-up text-success"></i>}
						{msg}
					</div>
					<div className="col-xs-12">
						<ul>
							<li><Link to="/">Go Home</Link></li>
							{isError ? null : <li><Link to="/picks/set">Continue making picks</Link></li>}
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
};

QuickPick.propTypes = {
	params: PropTypes.object.isRequired
};

export default QuickPick;
