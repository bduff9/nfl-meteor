'use strict';

import { Meteor } from 'meteor/meteor';
import React, { PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { DEFAULT_LEAGUE, OVERALL_PRIZES, POOL_COST, SURVIVOR_COST, SURVIVOR_PRIZES, TOP_OVERALL_FOR_HISTORY, TOP_SURVIVOR_FOR_HISTORY, TOP_WEEKLY_FOR_HISTORY, WEEKS_IN_SEASON, WEEKLY_PRIZES } from '../../api/constants';
import { formattedPlace } from '../../api/global';
import { Loading } from './Loading';
import { getNextGame } from '../../api/collections/games';
import { getSortedSurvivorPicks } from '../../api/collections/survivorpicks';
import { getAllTiebreakersForUser } from '../../api/collections/tiebreakers';
import { getCurrentUser } from '../../api/collections/users';

const ViewPayments = ({ currentUser, survivorPlace, nextGame, pageReady, stillAlive, tiebreakers }) => {
	let total;

	const getPaymentMessage = (amount, type) => {
		const NOTE_FOR_EPAY = 'Please ONLY put your name and/or ASWNN in the memo';

		switch (type) {
			case 'Cash':
				return <span className="amount-message">Please pay ${amount} to Brian or Billy</span>;
			case 'PayPal':
				return <span className="amount-message">Please pay ${amount} using PayPal: <a href={`https://www.paypal.me/brianduffey/${amount}`} target="_blank">paypal.me/brianduffey/{amount}</a><br /><br />{NOTE_FOR_EPAY}</span>;
			case 'Zelle':
				return <span className="amount-message">Please pay ${amount} using your bank&apos;s Zelle service to account bduff9@gmail.com<br /><br />{NOTE_FOR_EPAY}</span>;
			case 'Venmo':
				return <span className="amount-message">Please pay ${amount} using Venmo to account bduff9@gmail.com<br /><br />{NOTE_FOR_EPAY}</span>;
			default:
				console.error('Unknown account type', type);

				return 'ERROR';
		}
	};

	return (
		<div className="container-fluid view-payments-wrapper">
			{pageReady ? (
				<div className="row">
					<Helmet title="View Payments" />
					<div className="col-md-11">
						<div className="row">
							<div className="hidden-md-up">
								<h3 className="title-text text-xs-center text-md-left">View My Payments</h3>
							</div>
						</div>
						<div className="view-payments">
							<table className="table table-striped table-hover">
								<thead>
									<tr>
										<th>Week</th>
										<th>Description</th>
										<th>Amount</th>
									</tr>
								</thead>
								<tbody>
									<tr className="table-danger">
										<td></td>
										<td>Confidence Pool</td>
										<td data-running-total={total = -1 * POOL_COST}>${POOL_COST}</td>
									</tr>
									{currentUser.survivor ? (
										<tr className="table-danger">
											<td></td>
											<td>Survivor Pool</td>
											<td data-running-total={total -= SURVIVOR_COST}>${SURVIVOR_COST}</td>
										</tr>
									)
										:
										null
									}
									{currentUser.paid ? (
										<tr>
											<td></td>
											<td>Paid</td>
											<td data-running-total={total += currentUser.paid}>${currentUser.paid}</td>
										</tr>
									)
										:
										null
									}
									{tiebreakers.filter(tiebreaker => (tiebreaker.week < nextGame.week || nextGame.notFound) && tiebreaker.place_in_week <= TOP_WEEKLY_FOR_HISTORY).map(tiebreaker => (
										<tr className="table-success" key={`tiebreaker-${tiebreaker._id}`}>
											<td>{tiebreaker.week}</td>
											<td>{`Won ${formattedPlace(tiebreaker.place_in_week)} place`}</td>
											<td data-running-total={total += WEEKLY_PRIZES[tiebreaker.place_in_week]}>${WEEKLY_PRIZES[tiebreaker.place_in_week]}</td>
										</tr>
									))}
									{nextGame.notFound && currentUser.overall_place <= TOP_OVERALL_FOR_HISTORY ? (
										<tr className="table-success">
											<td></td>
											<td>{`Took ${formattedPlace(currentUser.overall_place)} place overall`}</td>
											<td data-running-total={total += OVERALL_PRIZES[currentUser.overall_place]}>${OVERALL_PRIZES[currentUser.overall_place]}</td>
										</tr>
									)
										:
										null
									}
									{(nextGame.notFound || (nextGame.week > 1 && stillAlive.length < 2)) && survivorPlace <= TOP_SURVIVOR_FOR_HISTORY ? (
										<tr className="table-success">
											<td></td>
											<td>{`Took ${formattedPlace(survivorPlace)} place in survivor`}</td>
											<td data-running-total={total += SURVIVOR_PRIZES[survivorPlace]}>${SURVIVOR_PRIZES[survivorPlace]}</td>
										</tr>
									)
										:
										null
									}
								</tbody>
								<tfoot>
									<tr>
										<td colSpan={2} className="text-xs-right">{total >= 0 ? 'TOTAL YOU ARE OWED:' : 'TOTAL YOU OWE:'}</td>
										<td>${Math.abs(total)}</td>
									</tr>
								</tfoot>
							</table>
							{total < 0 ? <em>{getPaymentMessage(Math.abs(total), currentUser.payment_type)}</em> : null}
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

ViewPayments.propTypes = {
	currentLeague: PropTypes.string.isRequired,
	currentUser: PropTypes.object.isRequired,
	survivorPlace: PropTypes.number.isRequired,
	nextGame: PropTypes.object.isRequired,
	pageReady: PropTypes.bool.isRequired,
	stillAlive: PropTypes.arrayOf(PropTypes.object).isRequired,
	tiebreakers: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default createContainer(() => {
	const user_id = Meteor.userId();
	const currentLeague = DEFAULT_LEAGUE; //Session.get('selectedLeague'), //TODO: Eventually will need to uncomment this and allow them to change current league
	const survivorHandle = Meteor.subscribe('overallSurvivor', currentLeague, WEEKS_IN_SEASON);
	const survivorReady = survivorHandle.ready();
	const tiebreakersHandle = Meteor.subscribe('allTiebreakersForUser', currentLeague);
	const tiebreakersReady = tiebreakersHandle.ready();
	const currentUser = getCurrentUser.call({});
	const nextGame = getNextGame.call({});
	let sortedUsers = [];
	let stillAlive = [];
	let tiebreakers = [];
	let survivorPlace = 99;
	let mySurvivor;

	if (survivorReady) {
		sortedUsers = getSortedSurvivorPicks.call({ league: currentLeague });

		if (currentUser.survivor) {
			mySurvivor = sortedUsers.filter(u => u.user_id === user_id);

			if (mySurvivor.length > 0) survivorPlace = mySurvivor[0].place;
		}

		stillAlive = sortedUsers.filter(user => user.weeks === WEEKS_IN_SEASON);
	}

	if (tiebreakersReady) tiebreakers = getAllTiebreakersForUser.call({ league: currentLeague, user_id });

	return {
		currentLeague,
		currentUser,
		survivorPlace,
		nextGame,
		pageReady: survivorReady && tiebreakersReady,
		stillAlive,
		tiebreakers
	};
}, ViewPayments);
