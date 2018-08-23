'use strict';

import React, { PropTypes } from 'react';
import { IndexLink, Link } from 'react-router';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import sweetAlert from 'sweetalert';

import { DEFAULT_LEAGUE, SURVIVOR_COST } from '../../api/constants';
import { formatDate, handleError, getCurrentSeasonYear } from '../../api/global';
import Countdown from './Countdown';
import { getNextGame } from '../../api/collections/games';
import { getLastChatAction, getUnreadChatCount, getUnreadMessages } from '../../api/collections/nfllogs';
import { getMySurvivorPicks } from '../../api/collections/survivorpicks';
import { getSystemValues } from '../../api/collections/systemvals';
import { getTiebreaker } from  '../../api/collections/tiebreakers';
import { updateSelectedWeek, updateUserSurvivor } from '../../api/collections/users';

const Navigation = ({ currentUser, currentWeek, currentWeekTiebreaker, logoutOnly, nextGame, openMenu, pageReady, selectedWeek, survivorPicks, systemVals, tiebreaker, unreadChatCt, unreadMessages, _toggleMenu, _toggleRightSlider }) => {
	const showCountdown = nextGame && nextGame.game === 1;
	const hasSeasonStarted = nextGame && (nextGame.week > 1 || nextGame.game > 1);
	const seasonStart = formatDate(nextGame.kickoff);
	let msgCt = unreadMessages.length;

	if (pageReady && !logoutOnly) {
		if (currentUser) msgCt += (currentUser.paid ? 0 : 1);
		if (currentWeekTiebreaker) msgCt += (currentWeekTiebreaker.submitted || nextGame.notFound ? 0 : 1);
		if (currentUser.survivor) msgCt += (currentUser.survivor && !survivorPicks.filter(s => s.week === currentWeek)[0] || survivorPicks.filter(s => s.week === currentWeek)[0].pick_id ? 0 : 1);
	}

	const _initPool = (ev) => {
		ev.preventDefault();
		if (confirm(`Are you sure you want to do this?  All data will be reset for the ${getCurrentSeasonYear()} season`)) {
			Meteor.call('initPoolOnServer', {}, err => {
				if (err) return handleError(err);
				Meteor.logout();
			});
		}
		return false;
	};
	const _refreshGames = (ev) => {
		ev.preventDefault();
		Meteor.call('Games.refreshGameData', {}, handleError);
		return false;
	};
	const _selectWeek = (newWeek, ev) => {
		ev.preventDefault();
		if (newWeek > 0 && newWeek < 18) updateSelectedWeek.call({ week: newWeek }, handleError);
	};
	const _confirmSurvivorPool = (ev) => {
		sweetAlert({
			title: 'Register for Survivor Pool?',
			text: `Are you sure you want to register for the survivor pool?\n\nParticipating in the survivor pool costs an additional $${SURVIVOR_COST}.  Press 'OK' to join or 'Cancel' to decide later.\n\nNote: You have until the first kickoff (on ${seasonStart}) to register.`,
			type: 'info',
			showCancelButton: true,
			closeOnConfirm: false,
		}, function () {
			updateUserSurvivor.call({ survivor: true });
			sweetAlert({
				title: 'Welcome to the Survivor Pool',
				text: 'You have successfully joined the survivor pool for this season.\n\nPlease be sure to select your pick prior to the first kickoff of each week.',
				type: 'success',
			});
		});
	};

	return (
		<div className={`col-xs-10 ${(openMenu ? '' : 'hidden-xs-down')} col-sm-3 col-lg-2 sidebar`}>
			{!logoutOnly ? (
				<div className="sidebar-inner">
					<i className="fa fa-times hidden-sm-up close-menu" onClick={_toggleMenu} />
					<ul className="nav nav-sidebar">
						<li>
							<h5>{`Welcome, ${currentUser.first_name}`}</h5>
						</li>
						<li><Link to="/users/edit" activeClassName="active">Edit My Profile</Link></li>
						<li>
							<Link to="/users/payments" activeClassName="active">View Payments</Link>
						</li>
						<li><Link to={{ pathname: '/logout', state: { isLogout: true } }} activeClassName="active">Signout</Link></li>
					</ul>
					{selectedWeek ? (
						<ul className="nav nav-sidebar">
							<li>
								<i className={'fa fa-fw fa-caret-left' + (selectedWeek === 1 ? ' disabled' : '')} onClick={_selectWeek.bind(null, selectedWeek - 1)} />
								{` Week ${selectedWeek} `}
								<i className={'fa fa-fw fa-caret-right' + (selectedWeek === 17 ? ' disabled' : '')} onClick={_selectWeek.bind(null, selectedWeek + 1)} />
							</li>
							{currentWeek !== selectedWeek ? (
								<li>
									<a href="#" onClick={_selectWeek.bind(null, currentWeek)}><i className="fa fa-fw fa-reply" /> Current Week</a>
								</li>
							)
								:
								null
							}
						</ul>
					)
						:
						null
					}
					<ul className="nav nav-sidebar">
						<li><IndexLink to="/" activeClassName="active">Dashboard</IndexLink></li>
						<li>
							<Link to="/stats" activeClassName="active">Statistics</Link>
						</li>
						<li><Link to="/picks/view" activeClassName="active">View My Picks</Link></li>
						{tiebreaker ?
							(selectedWeek >= currentWeek && !tiebreaker.submitted ?
								<li><Link to="/picks/set" activeClassName="active">Make Picks</Link></li>
								:
								<li><Link to="/picks/viewall" activeClassName="active">View All Picks</Link></li>
							)
							:
							null
						}
						{currentUser.survivor ? [
							(survivorPicks.length === 17 ? <li key="make-survivor-picks"><Link to="/survivor/set" activeClassName="active">Make Survivor Picks</Link></li> : null),
							(nextGame.week > 1 || nextGame.game > 1 ? <li key="view-survivor-picks"><Link to="/survivor/view" activeClassName="active">View Survivor Picks</Link></li> : null)
						]
							:
							hasSeasonStarted ? (
								<li><a href="javascript:void(0)" className="disabled-link">No Survivor Pool</a></li>
							)
								:
								(
									<li><button className="btn btn-success btn-glowing" onClick={_confirmSurvivorPool}>Join Survivor Pool</button></li>
								)
						}
					</ul>
					<ul className="nav nav-sidebar">
						<li>
							<a href="#" onClick={_toggleRightSlider.bind(null, 'messages')}>
								{(msgCt > 0 ? <strong>Messages</strong> : 'Messages')}&nbsp;
								{(msgCt > 0 ? <span title={`You have ${msgCt} messages`} className="tag tag-pill tag-pulsate tag-danger">{msgCt}</span> : null)}
							</a>
						</li>
						<li><a href="#" onClick={_toggleRightSlider.bind(null, 'rules')}>Rules</a></li>
						<li>
							<a href="#" onClick={_toggleRightSlider.bind(null, 'scoreboard')}>
								{showCountdown ? <Countdown nextKickoff={nextGame.kickoff} week={nextGame.week} /> : 'NFL Scoreboard'}
							</a>
						</li>
						<li>
							<a href="#" onClick={_toggleRightSlider.bind(null, 'chat')}>
								{(unreadChatCt > 0 ? <strong>Chat</strong> : 'Chat')}
								{(unreadChatCt > 0 ? <span title={`There are ${unreadChatCt} new chats`} className="tag tag-pill tag-pulsate tag-primary">{unreadChatCt}</span> : null)}
							</a>
						</li>
					</ul>
					{currentUser.is_admin ? (
						<ul className="nav nav-sidebar">
							<li><Link to="/admin/users" activeClassName="active">Manage Users</Link></li>
							<li><Link to="/admin/logs" activeClassName="active">View Logs</Link></li>
							<li><a href="#" onClick={_refreshGames}>Refresh Games</a></li>
							<li><Link to="/admin/data" activeClassName="active">TODO: Manage Data</Link></li>
							{getCurrentSeasonYear() > systemVals.year_updated ? <li><a href="#" onClick={_initPool}>Init Pool for {getCurrentSeasonYear()} Season</a></li> : null}
						</ul>
					)
						:
						null
					}
				</div>
			)
				:
				(
					<div className="sidebar-inner">
						<ul className="nav nav-sidebar">
							<li><Link to={{ pathname: '/logout', state: { isLogout: true } }} activeClassName="active">Signout</Link></li>
						</ul>
					</div>
				)}
		</div>
	);
};

Navigation.propTypes = {
	currentUser: PropTypes.object.isRequired,
	currentWeek: PropTypes.number,
	currentWeekTiebreaker: PropTypes.object.isRequired,
	logoutOnly: PropTypes.bool.isRequired,
	nextGame: PropTypes.object,
	openMenu: PropTypes.bool.isRequired,
	pageReady: PropTypes.bool.isRequired,
	selectedWeek: PropTypes.number,
	survivorPicks: PropTypes.arrayOf(PropTypes.object).isRequired,
	systemVals: PropTypes.object.isRequired,
	tiebreaker: PropTypes.object.isRequired,
	unreadChatCt: PropTypes.number.isRequired,
	unreadMessages: PropTypes.arrayOf(PropTypes.object).isRequired,
	_toggleMenu: PropTypes.func.isRequired,
	_toggleRightSlider: PropTypes.func.isRequired
};

export default createContainer(({ currentUser, currentWeek, logoutOnly, rightSlider, selectedWeek, ...rest }) => {
	const currentLeague = DEFAULT_LEAGUE, //Session.get('selectedLeague'), //TODO: Eventually will need to uncomment this and allow them to change current league
			lastChatActionHandle = Meteor.subscribe('lastChatAction'),
			lastChatActionReady = lastChatActionHandle.ready(),
			nextGameHandle = Meteor.subscribe('nextGameToStart'),
			nextGameReady = nextGameHandle.ready(),
			messagesHandle = Meteor.subscribe('unreadMessages'),
			messagesReady = messagesHandle.ready(),
			survivorHandle = Meteor.subscribe('mySurvivorPicks', currentLeague),
			survivorReady = survivorHandle.ready(),
			tiebreakerHandle = Meteor.subscribe('singleTiebreakerForUser', selectedWeek, currentLeague),
			tiebreakerReady = tiebreakerHandle.ready(),
			currentWeekTiebreakerHandle = Meteor.subscribe('singleTiebreakerForUser', currentWeek, currentLeague),
			currentWeekTiebreakerReady = currentWeekTiebreakerHandle.ready();
	let unreadChatCt = 0,
			nextGame = {},
			unreadMessages = [],
			survivorPicks = [],
			systemVals = getSystemValues.call({}),
			tiebreaker = {},
			currentWeekTiebreaker = {},
			unreadChatReady = false,
			lastChatAction, unreadChatHandle;
	if (!logoutOnly) {
		if (lastChatActionReady) {
			lastChatAction = getLastChatAction.call({});
			let lastAction;
			if (lastChatAction) {
				const { action, when } = lastChatAction;
				lastAction = { action, when };
			}
			unreadChatHandle = Meteor.subscribe('unreadChats', lastChatAction);
			unreadChatReady = unreadChatHandle.ready();
			if (unreadChatReady) unreadChatCt = getUnreadChatCount.call({ lastAction });
		}
		if (nextGameReady) nextGame = getNextGame.call({});
		if (messagesReady) unreadMessages = getUnreadMessages.call({});
		if (survivorReady) survivorPicks = getMySurvivorPicks.call({ league: currentLeague });
		if (tiebreakerReady) tiebreaker = getTiebreaker.call({ league: currentLeague, week: selectedWeek });
		if (currentWeekTiebreakerReady) currentWeekTiebreaker = getTiebreaker.call({ league: currentLeague, week: currentWeek });
	}
	return {
		...rest,
		currentUser,
		currentWeek,
		currentWeekTiebreaker,
		logoutOnly,
		nextGame,
		pageReady: currentWeekTiebreakerReady && lastChatActionReady && nextGameReady && messagesReady && survivorReady && tiebreakerReady && unreadChatReady,
		selectedWeek,
		survivorPicks,
		systemVals,
		tiebreaker,
		unreadChatCt,
		unreadMessages
	};
}, Navigation);
