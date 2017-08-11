'use strict';

import React, { PropTypes } from 'react';
import { IndexLink, Link } from 'react-router';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import { DEFAULT_LEAGUE } from '../../api/constants';
import { displayError, getCurrentSeasonYear } from '../../api/global';
import Countdown from './Countdown';
import { getNextGame } from '../../api/collections/games';
import { getUnreadChatCount, getUnreadMessages } from '../../api/collections/nfllogs';
import { getMySurvivorPicks } from '../../api/collections/survivorpicks';
import { getSystemValues } from '../../api/collections/systemvals';
import { getTiebreaker } from  '../../api/collections/tiebreakers';
import { updateSelectedWeek } from '../../api/collections/users';

const Navigation = ({ currentUser, currentWeek, logoutOnly, nextGame, openMenu, pageReady, selectedWeek, survivorPicks, systemVals, tiebreaker, unreadChatCt, unreadMessages, _toggleMenu, _toggleRightSlider }) => {
	let msgCt = unreadMessages.length,
			showCountdown = nextGame && nextGame.game === 1;

	if (pageReady && !logoutOnly) {
		if (currentUser) msgCt += (currentUser.paid ? 0 : 1);
		if (tiebreaker) msgCt += (tiebreaker.submitted ? 0 : 1);
		if (currentUser.survivor) msgCt += (currentUser.survivor && !survivorPicks.filter(s => s.week === currentWeek)[0] || survivorPicks.filter(s => s.week === currentWeek)[0].pick_id ? 0 : 1);
	}

	const _initPool = (ev) => {
		ev.preventDefault();
		if (confirm(`Are you sure you want to do this?  All data will be reset for the ${getCurrentSeasonYear()} season`)) {
			Meteor.call('initPoolOnServer', {}, err => {
				if (err) return displayError(err);
				Meteor.logout();
			});
		}
		return false;
	};
	const _refreshGames = (ev) => {
		ev.preventDefault();
		Meteor.call('Games.refreshGameData', {}, displayError);
		return false;
	};
	const _selectWeek = (newWeek, ev) => {
		ev.preventDefault();
		if (newWeek > 0 && newWeek < 18) updateSelectedWeek.call({ week: newWeek }, displayError);
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
						<li><Link to="/users/payments" activeClassName="active">View Payments</Link></li>
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
						<li><Link to="/picks/view" activeClassName="active">View My Picks</Link></li>
						{selectedWeek >= currentWeek && tiebreaker && !tiebreaker.submitted ? <li><Link to="/picks/set" activeClassName="active">Make Picks</Link></li> : null}
						{tiebreaker && (selectedWeek < currentWeek || tiebreaker.submitted) ? <li><Link to="/picks/viewall" activeClassName="active">View All Picks</Link></li> : null}
						{currentUser.survivor ? [
							(survivorPicks.length === 17 ? <li key="make-survivor-picks"><Link to="/survivor/set" activeClassName="active">Make Survivor Picks</Link></li> : null),
							(nextGame.week > 1 || nextGame.game > 1 ? <li key="view-survivor-picks"><Link to="/survivor/view" activeClassName="active">View Survivor Picks</Link></li> : null)
						]
							:
							<li><a href="javascript:void(0)" style={{ opacity: 0.5, pointerEvents: 'none', cursor: 'not-allowed' }}>No Survivor Pool</a></li>
						}
					</ul>
					<ul className="nav nav-sidebar">
						<li>
							<a href="#" onClick={_toggleRightSlider.bind(null, 'messages')}>
								{(msgCt > 0 ? <strong>Messages</strong> : 'Messages')}&nbsp;
								{(msgCt > 0 ? <span title={`You have ${msgCt} messages`} className="tag tag-danger">{msgCt}</span> : null)}
							</a>
						</li>
						<li><a href="#" onClick={_toggleRightSlider.bind(null, 'rules')}>Rules</a></li>
						<li>
							<a href="#" onClick={_toggleRightSlider.bind(null, 'scoreboard')}>
								{showCountdown ? <Countdown nextKickoff={nextGame.kickoff} /> : 'NFL Scoreboard'}
							</a>
						</li>
						<li>
							<a href="#" onClick={_toggleRightSlider.bind(null, 'chat')}>
								{(unreadChatCt > 0 ? <strong>Chat</strong> : 'Chat')}
								{(unreadChatCt > 0 ? <span title={`There are ${unreadChatCt} new chats`} className="tag tag-primary">{unreadChatCt}</span> : null)}
							</a>
						</li>
					</ul>
					{currentUser.is_admin ? (
						<ul className="nav nav-sidebar">
							<li><Link to="/admin/users" activeClassName="active">Manage Users</Link></li>
							<li><Link to="/admin/logs" activeClassName="active">View Logs</Link></li>
							<li><a href="#" onClick={_refreshGames}>Refresh Games</a></li>
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
	logoutOnly: PropTypes.bool.isRequired,
	nextGame: PropTypes.object,
	openMenu: PropTypes.bool.isRequired,
	pageReady: PropTypes.bool.isRequired,
	selectedWeek: PropTypes.number,
	survivorPicks: PropTypes.arrayOf(PropTypes.object).isRequired,
	systemVals: PropTypes.object.isRequired,
	tiebreaker: PropTypes.object,
	unreadChatCt: PropTypes.number.isRequired,
	unreadMessages: PropTypes.arrayOf(PropTypes.object).isRequired,
	_toggleMenu: PropTypes.func.isRequired,
	_toggleRightSlider: PropTypes.func.isRequired
};

export default createContainer(({ currentUser, currentWeek, logoutOnly, rightSlider, ...rest }) => {
	const currentLeague = DEFAULT_LEAGUE, //Session.get('selectedLeague'), //TODO: Eventually will need to uncomment this and allow them to change current league
			unreadChatHandle = Meteor.subscribe('unreadChats'),
			unreadChatReady = unreadChatHandle.ready(),
			nextGameHandle = Meteor.subscribe('nextGameToStart'),
			nextGameReady = nextGameHandle.ready(),
			messagesHandle = Meteor.subscribe('unreadMessages'),
			messagesReady = messagesHandle.ready(),
			survivorHandle = Meteor.subscribe('mySurvivorPicks', currentLeague),
			survivorReady = survivorHandle.ready(),
			tiebreakerHandle = Meteor.subscribe('singleTiebreakerForUser', currentWeek, currentLeague),
			tiebreakerReady = tiebreakerHandle.ready();
	let unreadChatCt = 0,
			nextGame = {},
			unreadMessages = [],
			survivorPicks = [],
			systemVals = getSystemValues.call({}),
			tiebreaker = {};
	if (!logoutOnly) {
		if (unreadChatReady) unreadChatCt = getUnreadChatCount.call({});
		if (nextGameReady) nextGame = getNextGame.call({});
		if (messagesReady) unreadMessages = getUnreadMessages.call({});
		if (survivorReady) survivorPicks = getMySurvivorPicks.call({ league: currentLeague });
		if (tiebreakerReady) tiebreaker = getTiebreaker.call({ league: currentLeague, week: currentWeek });
	}
	return {
		...rest,
		currentUser,
		logoutOnly,
		nextGame,
		pageReady: nextGameReady && messagesReady && survivorReady && tiebreakerReady && unreadChatReady,
		survivorPicks,
		systemVals,
		tiebreaker,
		unreadChatCt,
		unreadMessages
	};
}, Navigation);
