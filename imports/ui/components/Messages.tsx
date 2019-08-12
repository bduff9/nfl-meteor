import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import React, { FC } from 'react';

import {
	getFirstGameOfWeek,
	getNextGame,
	getPaymentDue,
	TGame,
} from '../../api/collections/games';
import { getAllMessages, TNFLLog } from '../../api/collections/nfllogs';
import { hasSubmittedSurvivorPicks } from '../../api/collections/survivorpicks';
import { getTiebreaker, TTiebreaker } from '../../api/collections/tiebreakers';
import { getCurrentUser, TUser } from '../../api/collections/users';
import { TWeek } from '../../api/commonTypes';
import { DEFAULT_LEAGUE, PAYMENT_DUE_WEEK } from '../../api/constants';
import { formatDate, handleError } from '../../api/global';

import Loading from './Loading';
import { Message } from './Message';

export type TMessagesProps = {
	currentUser: TUser;
	currentWeek: TWeek;
	firstGame: TGame | null;
	messages: TNFLLog[];
	nextGame: TGame | null;
	pageReady: boolean;
	paymentDue: Date;
	submittedSurvivor: boolean;
	tiebreaker: TTiebreaker | null;
};

const Messages: FC<TMessagesProps> = ({
	currentUser,
	currentWeek,
	firstGame,
	messages,
	nextGame,
	pageReady,
	paymentDue,
	submittedSurvivor,
	tiebreaker,
}): JSX.Element => {
	const { paid, survivor } = currentUser;
	const submittedPicks = tiebreaker && tiebreaker.submitted;

	return (
		<div className="messages">
			<h3 className="text-center">Private Messages</h3>
			<div className="inner-messages">
				<div className="message-list">
					{firstGame && nextGame && pageReady ? (
						<div className="all-message-wrapper">
							{!paid ? (
								<Message
									message={`Please pay before ${formatDate(paymentDue)}`}
									unread
								/>
							) : null}
							{!submittedPicks && !nextGame.notFound ? (
								<Message
									message={`Your week ${currentWeek} picks are due by ${formatDate(
										firstGame.kickoff,
										true,
									)}`}
									unread
								/>
							) : null}
							{survivor && !submittedSurvivor ? (
								<Message
									message={`Your week ${currentWeek} survivor pick is due by ${formatDate(
										firstGame.kickoff,
										true,
									)}`}
									unread
								/>
							) : null}
							{messages.map(
								(message): JSX.Element => (
									<Message
										from={message.getUser()}
										msgId={message._id}
										message={message.message}
										sent={formatDate(message.when, true)}
										unread={!message.is_read}
										key={`message-${message._id}`}
									/>
								),
							)}
						</div>
					) : (
						<Loading />
					)}
				</div>
			</div>
		</div>
	);
};

export default withTracker(
	(): TMessagesProps => {
		const currentUser = getCurrentUser.call({});
		const currentWeek = Session.get('currentWeek');
		const currentLeague = DEFAULT_LEAGUE; //Session.get('selectedLeague'), //TODO: Eventually will need to uncomment this and allow them to change current league
		const tiebreakerHandle = Meteor.subscribe(
			'singleTiebreakerForUser',
			currentWeek,
			currentLeague,
		);
		const tiebreakerReady = tiebreakerHandle.ready();
		const survivorPicksHandle = Meteor.subscribe(
			'mySurvivorPicks',
			currentLeague,
		);
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
		let firstGame = null;
		let nextGame = null;
		let tiebreaker = null;
		let paymentDue = Session.get('paymentDue');
		let submittedSurvivor = false;

		if (firstGameReady)
			firstGame = getFirstGameOfWeek.call({ week: currentWeek });

		if (messagesReady) messages = getAllMessages.call({});

		if (survivorPicksReady)
			submittedSurvivor = hasSubmittedSurvivorPicks.call({
				league: currentLeague,
				week: currentWeek,
			});

		if (tiebreakerReady)
			tiebreaker = getTiebreaker.call({
				league: currentLeague,
				week: currentWeek,
			});

		if (week3GamesReady) paymentDue = getPaymentDue.call({}, handleError);

		if (nextGameReady) nextGame = getNextGame.call({});

		return {
			currentUser,
			currentWeek,
			firstGame,
			messages,
			nextGame,
			pageReady:
				firstGameReady &&
				messagesReady &&
				survivorPicksReady &&
				tiebreakerReady &&
				usersReady &&
				week3GamesReady,
			paymentDue,
			submittedSurvivor,
			tiebreaker,
		};
	},
)(Messages);
