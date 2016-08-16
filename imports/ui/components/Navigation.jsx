/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';
import { IndexLink, Link } from 'react-router';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import './Navigation.scss';
import { NFLLog, User } from '../../api/schema';
import { updateSelectedWeek } from '../../api/collections/users';
import { displayError } from '../../api/global';

const Navigation = ({ currentUser, currentWeek, logoutOnly, openMenu, pageReady, selectedWeek, unreadChatCt, _toggleMenu, _toggleRightSlider }) => {
  const tiebreaker = currentUser.tiebreakers[selectedWeek - 1],
      survivorPicks = currentUser.survivor,
      msgCt = 3;

  const _selectWeek = (newWeek, ev) => {
    ev.preventDefault();
    if (newWeek > 0 && newWeek < 18) updateSelectedWeek.call({ week: newWeek }, displayError);
  };

//TODO handle messages (dismissable (i.e. non-submit alert) and non-dismissable (i.e. payment due)) from NFLLogs
  return (
    <div className={`col-xs-12 ${(openMenu ? '' : 'hidden-xs-down')} col-sm-3 col-md-2 sidebar`}>
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
            <li><Link to="/survivor/view" activeClassName="active">View Survivor Picks</Link></li>
          </ul>
          <ul className="nav nav-sidebar">
            <li><a href="#" onClick={_toggleRightSlider.bind(null, 'messages')}>{(msgCt > 0 ? <strong>{`${msgCt} Messages`}</strong> : 'No new messages')}</a></li>
            <li><a href="#" onClick={_toggleRightSlider.bind(null, 'rules')}>Rules</a></li>
            <li><a href="#" onClick={_toggleRightSlider.bind(null, 'scoreboard')}>NFL Scoreboard</a></li>
            <li><a href="#" onClick={_toggleRightSlider.bind(null, 'chat')}>{(unreadChatCt > 0 ? <strong>{`${unreadChatCt} New Chats`}</strong> : 'No new chats')}</a></li>
          </ul>
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
  openMenu: PropTypes.bool.isRequired,
  pageReady: PropTypes.bool.isRequired,
  selectedWeek: PropTypes.number,
  unreadChatCt: PropTypes.number.isRequired,
  _toggleMenu: PropTypes.func.isRequired,
  _toggleRightSlider: PropTypes.func.isRequired
};

export default createContainer(({ currentUser, rightSlider, ...rest }) => {
  const unreadChatHandle = Meteor.subscribe('unreadChats', currentUser.chat_hidden),
      unreadChatReady = unreadChatHandle.ready();
  let unreadChatCt = 0,
      pageReady = false;
  if (unreadChatReady) {
    if (rightSlider !== 'chat') {
      unreadChatCt = NFLLog.find({ action: 'CHAT', when: { $gt: currentUser.chat_hidden }}).count();
    }
    pageReady = true;
  }
  return {
    ...rest,
    currentUser,
    pageReady,
    unreadChatCt
  };
}, Navigation);
