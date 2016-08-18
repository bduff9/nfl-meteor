/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';
import { IndexLink, Link } from 'react-router';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import './Navigation.scss';
import { Game, NFLLog, User } from '../../api/schema';
import { updateSelectedWeek } from '../../api/collections/users';
import { displayError } from '../../api/global';

const Navigation = ({ currentUser, currentWeek, logoutOnly, nextGame, openMenu, pageReady, selectedWeek, unreadChatCt, _toggleMenu, _toggleRightSlider }) => {
  const tiebreaker = currentUser.tiebreakers[selectedWeek - 1],
      survivorPicks = currentUser.survivor,
      msgCt = 3;

  const _selectWeek = (newWeek, ev) => {
    ev.preventDefault();
    if (newWeek > 0 && newWeek < 18) updateSelectedWeek.call({ week: newWeek }, displayError);
  };

//TODO handle messages (dismissable (i.e. non-submit alert) and non-dismissable (i.e. payment due)) from NFLLogs
  return (
    <div className={`col-xs-12 ${(openMenu ? '' : 'hidden-xs-down')} col-sm-3 col-lg-2 sidebar`}>
      {!logoutOnly ? (
        <div className="sidebar-inner">
          <i className="fa fa-times hidden-sm-up close-menu" onClick={_toggleMenu} />
          <ul className="nav nav-sidebar">
            <li>
              <h6>
                {`Welcome, ${currentUser.first_name}`}&nbsp;
                {(msgCt > 0) ? <span title={`You have ${msgCt} messages`} className="tag tag-danger">{msgCt}</span> : null}
                {(unreadChatCt > 0) ? <span title={`There are ${unreadChatCt} new chats`} className="tag tag-primary">{unreadChatCt}</span> : null}
              </h6>
            </li>
            <li><Link to="/users/edit" activeClassName="active">Edit My Profile</Link></li>
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
            {survivorPicks.length === 17 ? <li><Link to="/survivor/set" activeClassName="active">Make Survivor Picks</Link></li> : null}
            {nextGame.week > 1 || nextGame.game > 1 ? <li><Link to="/survivor/view" activeClassName="active">View Survivor Picks</Link></li> : null}
          </ul>
          <ul className="nav nav-sidebar">
            <li><a href="#" onClick={_toggleRightSlider.bind(null, 'messages')}>{(msgCt > 0 ? <strong>{`${msgCt} Messages`}</strong> : 'No new messages')}</a></li>
            <li><a href="#" onClick={_toggleRightSlider.bind(null, 'rules')}>Rules</a></li>
            <li><a href="#" onClick={_toggleRightSlider.bind(null, 'scoreboard')}>NFL Scoreboard</a></li>
            <li><a href="#" onClick={_toggleRightSlider.bind(null, 'chat')}>{(unreadChatCt > 0 ? <strong>{`${unreadChatCt} New Chats`}</strong> : 'No new chats')}</a></li>
          </ul>
          {currentUser.is_admin ? (
            <ul className="nav nav-sidebar">
              <li><Link to="/admin/users" activeClassName="active">Manage Users</Link></li>
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
  nextGame: PropTypes.object.isRequired,
  openMenu: PropTypes.bool.isRequired,
  pageReady: PropTypes.bool.isRequired,
  selectedWeek: PropTypes.number,
  unreadChatCt: PropTypes.number.isRequired,
  _toggleMenu: PropTypes.func.isRequired,
  _toggleRightSlider: PropTypes.func.isRequired
};

export default createContainer(({ currentUser, rightSlider, ...rest }) => {
  const unreadChatHandle = Meteor.subscribe('unreadChats'),
      unreadChatReady = unreadChatHandle.ready(),
      nextGameHandle = Meteor.subscribe('nextGameToStart'),
      nextGameReady = nextGameHandle.ready();
  let unreadChatCt = 0,
      nextGame = {},
      lastAction, chatHidden;
  if (unreadChatReady) {
    lastAction = NFLLog.findOne({ action: { $in: ['CHAT_HIDDEN', 'CHAT_OPENED'] }, user_id: currentUser._id }, { sort: { when: -1 }});
    if (lastAction) {
      chatHidden = (lastAction.action === 'CHAT_HIDDEN' ? lastAction.when : new Date());
      unreadChatCt = NFLLog.find({ action: 'CHAT', when: { $gt: chatHidden }}).count();
    }
  }
  if (nextGameReady) {
    nextGame = Game.find({ status: { $eq: 'P' }, game: { $ne: 0 }}, { sort: { kickoff: 1 }}).fetch()[0];
  }
  return {
    ...rest,
    currentUser,
    nextGame,
    pageReady: unreadChatReady && nextGameReady,
    unreadChatCt
  };
}, Navigation);
