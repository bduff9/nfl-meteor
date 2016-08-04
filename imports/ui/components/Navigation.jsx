import React, { PropTypes } from 'react';
import { IndexLink, Link } from 'react-router';

import './navigation.scss';
import { updateSelectedWeek } from '../../api/collections/users';
import { displayError } from '../../api/global';

export const Navigation = ({ currentUser, currentWeek, logoutOnly, selectedWeek }) => {

  const _selectWeek = (newWeek, ev) => {
    ev.preventDefault();
    if (newWeek > 0 && newWeek < 18) updateSelectedWeek.call({ week: newWeek }, displayError);
  };

  return (
    <div className="col-xs-2">
      {!logoutOnly ? (
        <div className="sidebar">
          <ul className="nav nav-sidebar">
            <li>{`Welcome, ${currentUser.first_name}`}</li>
          </ul>
          {selectedWeek ? (
            <ul className="nav nav-sidebar">
              <li>
                <i className={'fa fa-fw fa-caret-left' + (selectedWeek === 1 ? ' disabled' : '')} onClick={_selectWeek.bind(null, selectedWeek - 1)} />
                {`Week ${selectedWeek}`}
                <i className={'fa fa-fw fa-caret-right' + (selectedWeek === 17 ? ' disabled' : '')} onClick={_selectWeek.bind(null, selectedWeek + 1)} />
              </li>
              {currentWeek !== selectedWeek ? (
                <li>
                  <a href="#" onClick={_selectWeek.bind(null, currentWeek)}>Current Week</a>
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
            <li><IndexLink to="/" activeClassName="active">Home</IndexLink></li>
            <li><Link to="/picks/set" activeClassName="active">?Make Picks?</Link></li>
            <li><Link to="/survivor/set" activeClassName="active">?Make Survivor Picks?</Link></li>
            <li><Link to="/picks/view" activeClassName="active">View My Picks</Link></li>
            <li><Link to="/picks/viewall" activeClassName="active">?View All Picks?</Link></li>
            <li><Link to="/survivor/view" activeClassName="active">View Survivor Picks</Link></li>
          </ul>
          <ul className="nav nav-sidebar">
            <li>Rules</li>
            <li>NFL Scoreboard</li>
            <li>Chat</li>
          </ul>
          <ul className="nav nav-sidebar">
            <li><Link to="/users/edit" activeClassName="active">Edit My Profile</Link></li>
            <li><Link to={{ pathname: '/logout', state: { isLogout: true } }} activeClassName="active">Signout</Link></li>
          </ul>
        </div>
      )
      :
      (
        <div className="sidebar">
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
  selectedWeek: PropTypes.number
};
