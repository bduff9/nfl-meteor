'use strict';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';

import { DEFAULT_LEAGUE, PAYMENT_DUE_WEEK } from '../../api/constants';
import { formatDate, handleError } from '../../api/global';
import { Message } from './Message.jsx';
import { getFirstGameOfWeek, getNextGame, getPaymentDue } from '../../api/collections/games';
import { getAllMessages } from '../../api/collections/nfllogs';
import { hasSubmittedSurvivorPicks } from '../../api/collections/survivorpicks';
import { getTiebreaker } from '../../api/collections/tiebreakers';
import { getCurrentUser } from '../../api/collections/users';

class Messages extends Component {
	constructor (props) {
		super(props);

		this.state = {};
	}

	render () {
		const { currentUser, currentWeek, firstGame, messages, nextGame, pageReady, paymentDue, submittedSurvivor, tiebreaker } = this.props;
		const { paid, survivor } = currentUser;
		const submittedPicks = tiebreaker.submitted;

		return (
			<div className="messages">
				<h3 className="text-center">Private Messages</h3>
				<div className="inner-messages">
					<div className="message-list">
						{pageReady ? (
							<div className="all-message-wrapper">
								{!paid ? <Message message={`Please pay before ${formatDate(paymentDue)}`} unread /> : null}
								{!submittedPicks && !nextGame.notFound ? <Message message={`Your week ${currentWeek} picks are due by ${formatDate(firstGame.kickoff, true)}`} unread /> : null}
								{survivor && !submittedSurvivor ? <Message message={`Your week ${currentWeek} survivor pick is due by ${formatDate(firstGame.kickoff, true)}`} unread /> : null}
								{messages.map(message => <Message from={message.getUser()} msgId={'' + message._id} message={message.message} sent={formatDate(message.when, true)} unread={!message.is_read} key={'message' + message._id} />)}
							</div>
						)
							:
							(
								<div className="text-center loading">Loading...
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
	nextGame: PropTypes.object.isRequired,
	pageReady: PropTypes.bool.isRequired,
	paymentDue: PropTypes.object,
	submittedSurvivor: PropTypes.bool.isRequired,
	tiebreaker: PropTypes.object.isRequired,
};

export default withTracker(() => {
	const currentUser = getCurrentUser.call({});
	const currentWeek = Session.get('currentWeek');
	const currentLeague = DEFAULT_LEAGUE; //Session.get('selectedLeague'), //TODO: Eventually will need to uncomment this and allow them to change current league
	const tiebreakerHandle = Meteor.subscribe('singleTiebreakerForUser', currentWeek, currentLeague);
	const tiebreakerReady = tiebreakerHandle.ready();
	const survivorPicksHandle = Meteor.subscribe('mySurvivorPicks', currentLeague);
	const survivorPicksReady = survivorPicksHandle.ready();
	const messagesHandle = Meteor.subscribe('allMessages');
	const messagesReady = messagesHandle.ready();
	const usersHandle = Meteor.subscribe('basicUsersInfo');
	const usersReady = usersHandle.ready();
	const firstGameHandle = Meteor.subscribe('firstGameOfWeek', currentWeek);
	const firstGameReady = firstGameHandle.ready();
	const week3GamesHandle = Meteor.subscribe('gamesForWeek', PAYMENT_DUE_WEEK);
	const week3GamesReady = week3GamesHandle.ready();
	const nextGameHandle = Meteor.subscribe('nextGameToStart');
	const nextGameReady = nextGameHandle.ready();
	let messages = [];
	let firstGame = {};
	let nextGame = {};
	let tiebreaker = {};
	let paymentDue = Session.get('paymentDue');
	let submittedSurvivor = false;

	if (firstGameReady) firstGame = getFirstGameOfWeek.call({ week: currentWeek });
	if (messagesReady) messages = getAllMessages.call({});
	if (survivorPicksReady) submittedSurvivor = hasSubmittedSurvivorPicks.call({ league: currentLeague, week: currentWeek });
	if (tiebreakerReady) tiebreaker = getTiebreaker.call({ league: currentLeague, week: currentWeek });
	if (week3GamesReady) paymentDue = getPaymentDue.call({}, handleError);
	if (nextGameReady) nextGame = getNextGame.call({});

	return {
		currentUser,
		currentWeek,
		firstGame,
		messages,
		nextGame,
		pageReady: firstGameReady && messagesReady && survivorPicksReady && tiebreakerReady && usersReady && week3GamesReady,
		paymentDue,
		submittedSurvivor,
		tiebreaker,
	};
})(Messages);
