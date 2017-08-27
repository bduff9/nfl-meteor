'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import { moment } from 'meteor/momentjs:moment';
import { Session } from 'meteor/session';

import { DEFAULT_LEAGUE, PAYMENT_DUE_WEEK } from '../../api/constants';
import { handleError } from '../../api/global';
import { Message } from './Message.jsx';
import { getFirstGameOfWeekSync, getPaymentDue } from '../../api/collections/games';
import { getAllMessagesSync } from '../../api/collections/nfllogs';
import { hasSubmittedSurvivorPicksSync } from '../../api/collections/survivorpicks';
import { getTiebreakerSync } from '../../api/collections/tiebreakers';
import { getCurrentUserSync } from '../../api/collections/users';

class Messages extends Component {
	constructor (props) {
		super();
		this.state = {};
	}

	_formatDate (dt, incTime) {
		const fmt = (incTime ? 'h:mma [on] ddd, MMM Do' : 'ddd, MMM Do');
		return moment(dt).format(fmt);
	}

	render () {
		const { currentUser, currentWeek, firstGame, messages, pageReady, paymentDue, submittedSurvivor, tiebreaker } = this.props,
				{ paid, survivor } = currentUser,
				submittedPicks = tiebreaker.submitted;
		return (
			<div className="messages">
				<h3 className="text-xs-center">Private Messages</h3>
				<div className="inner-messages">
					<div className="message-list">
						{pageReady ? (
							<div className="all-message-wrapper">
								{!paid ? <Message message={`Please pay before ${this._formatDate(paymentDue)}`} unread /> : null}
								{!submittedPicks ? <Message message={`Your week ${currentWeek} picks are due by ${this._formatDate(firstGame.kickoff, true)}`} unread /> : null}
								{survivor && !submittedSurvivor ? <Message message={`Your week ${currentWeek} survivor pick is due by ${this._formatDate(firstGame.kickoff, true)}`} unread /> : null}
								{messages.map(message => <Message from={message.getUser()} msgId={'' + message._id} message={message.message} sent={this._formatDate(message.when, true)} unread={!message.is_read} key={'message' + message._id} />)}
							</div>
						)
							:
							(
								<div className="text-xs-center loading">Loading...
									<br />
									<i className="fa fa-spinner fa-pulse" />
								</div>
							)}
					</div>
				</div>
			</div>
		);
	}
}

Messages.propTypes = {
	currentUser: PropTypes.object.isRequired,
	currentWeek: PropTypes.number.isRequired,
	firstGame: PropTypes.object.isRequired,
	messages: PropTypes.arrayOf(PropTypes.object).isRequired,
	pageReady: PropTypes.bool.isRequired,
	paymentDue: PropTypes.object,
	submittedSurvivor: PropTypes.bool.isRequired,
	tiebreaker: PropTypes.object.isRequired
};

export default createContainer(() => {
	const currentUser = getCurrentUserSync({}),
			currentWeek = Session.get('currentWeek'),
			currentLeague = DEFAULT_LEAGUE, //Session.get('selectedLeague'), //TODO: Eventually will need to uncomment this and allow them to change current league
			tiebreakerHandle = Meteor.subscribe('singleTiebreakerForUser', currentWeek, currentLeague),
			tiebreakerReady = tiebreakerHandle.ready(),
			survivorPicksHandle = Meteor.subscribe('mySurvivorPicks', currentLeague),
			survivorPicksReady = survivorPicksHandle.ready(),
			messagesHandle = Meteor.subscribe('allMessages'),
			messagesReady = messagesHandle.ready(),
			usersHandle = Meteor.subscribe('basicUsersInfo'),
			usersReady = usersHandle.ready(),
			firstGameHandle = Meteor.subscribe('firstGameOfWeek', currentWeek),
			firstGameReady = firstGameHandle.ready(),
			week3GamesHandle = Meteor.subscribe('gamesForWeek', PAYMENT_DUE_WEEK),
			week3GamesReady = week3GamesHandle.ready(),
			paymentDue = Session.get('paymentDue');
	let messages = [],
			firstGame = {},
			tiebreaker = {},
			submittedSurvivor = false;
	if (firstGameReady) firstGame = getFirstGameOfWeekSync({ week: currentWeek });
	if (messagesReady) messages = getAllMessagesSync({});
	if (survivorPicksReady) submittedSurvivor = hasSubmittedSurvivorPicksSync({ league: currentLeague, week: currentWeek });
	if (tiebreakerReady) tiebreaker = getTiebreakerSync({ league: currentLeague, week: currentWeek });
	if (week3GamesReady) {
		getPaymentDue.call({}, (err, due) => {
			if (err) {
				handleError(err);
			} else {
				Session.set('paymentDue', due);
			}
		});
	}
	return {
		currentUser,
		currentWeek,
		firstGame,
		messages,
		pageReady: firstGameReady && messagesReady && survivorPicksReady && tiebreakerReady && usersReady && week3GamesReady,
		paymentDue,
		submittedSurvivor,
		tiebreaker
	};
}, Messages);
