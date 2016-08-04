import React, { PropTypes } from 'react';
import { IndexLink, Link } from 'react-router';

import './navigation.scss';

export const Navigation = ({ currentUser, logoutOnly, selectedWeek }) => {
  return (
    <div className="col-xs-2 sidebar">
      {!logoutOnly ?
        <ul className="nav nav-sidebar">
          <li>{`Welcome, ${currentUser.first_name}`}</li>
          <li></li>
          <li><IndexLink to="/" activeClassName="active">Home</IndexLink></li>
          <li></li>
          <li>&lt; {`Week ${selectedWeek}`} &gt;</li>
          <li>?Current Week?</li>
          <li></li>
          <li><Link to="/picks/set" activeClassName="active">?Make Picks?</Link></li>
          <li><Link to="/survivor/set" activeClassName="active">Make Survivor Picks</Link></li>
          <li><Link to="/picks/view" activeClassName="active">View My Picks</Link></li>
          <li><Link to="/picks/viewall" activeClassName="active">View All Picks</Link></li>
          <li><Link to="/survivor/view" activeClassName="active">View Survivor Picks</Link></li>
          <li></li>
          <li>Rules</li>
          <li>NFL Scoreboard</li>
          <li>Chat</li>
          <li />
          <li><Link to="/users/edit" activeClassName="active">Edit My Profile</Link></li>
          <li><Link to={{ pathname: '/logout', state: { isLogout: true } }} activeClassName="active">Signout</Link></li>
        </ul>
        :
        <ul className="nav nav-sidebar">
          <li><Link to={{ pathname: '/logout', state: { isLogout: true } }} activeClassName="active">Signout</Link></li>
        </ul>
      }
    </div>
  );
};

//TODO PropTypes
