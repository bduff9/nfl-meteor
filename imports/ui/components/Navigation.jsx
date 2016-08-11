/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';
import { IndexLink, Link } from 'react-router';

import './Navigation.scss';
import { updateSelectedWeek } from '../../api/collections/users';
import { displayError } from '../../api/global';

export const Navigation = ({ currentUser, currentWeek, logoutOnly, selectedWeek, _toggleRightSlider }) => {
  const tiebreaker = currentUser.tiebreakers[selectedWeek - 1],
      msgCt = 3;

  const _selectWeek = (newWeek, ev) => {
    ev.preventDefault();
    if (newWeek > 0 && newWeek < 18) updateSelectedWeek.call({ week: newWeek }, displayError);
  };

//TODO handle messages (dismissable (i.e. non-submit alert) and non-dismissable (i.e. payment due)) from NFLLogs
  return (
    <div className="col-sm-3 col-md-2 sidebar">
      {!logoutOnly ? (
        <div className="sidebar-inner">
          <ul className="nav nav-sidebar">
            <li>{`Welcome, ${currentUser.first_name}`} {(msgCt > 0) ? <span title={`You have ${msgCt} messages`} className="tag tag-danger">{msgCt}</span> : null}</li>
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
            <li><Link to="/survivor/set" activeClassName="active">?Make Survivor Picks?</Link></li>
            <li><Link to="/survivor/view" activeClassName="active">View Survivor Picks</Link></li>
          </ul>
          <ul className="nav nav-sidebar">
            <li><a href="#" onClick={_toggleRightSlider.bind(null, 'messages')}>{(msgCt > 0) ? <strong>{`${msgCt} Messages`}</strong> : 'No new messages'}</a></li>
            <li><a href="#" onClick={_toggleRightSlider.bind(null, 'rules')}>Rules</a></li>
            <li><a href="#" onClick={_toggleRightSlider.bind(null, 'scoreboard')}>NFL Scoreboard</a></li>
            <li><a href="#" onClick={_toggleRightSlider.bind(null, 'chat')}>Chat</a></li>
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
  selectedWeek: PropTypes.number,
  _toggleRightSlider: PropTypes.func.isRequired
};
