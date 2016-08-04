/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { User } from '../../api/schema';
import { Navigation } from '../components/Navigation.jsx';
import { currentWeek } from '../../api/collections/games';
import { displayError } from '../../api/global';

class AuthedLayout extends Component {
  constructor(props) {
    super();
    this.state = {};
  }

  render() {
    const { children, currentUser, location, selectedWeek } = this.props,
        logoutOnly = location.pathname.indexOf('create') > -1;
    return (
      <div className="row">
        <Helmet title="Welcome" />
        <Navigation currentUser={currentUser} logoutOnly={logoutOnly} selectedWeek={selectedWeek} />
        <div className="col-xs-offset-2 col-xs-10 main">{children}</div>
      </div>
    );
  }
}

AuthedLayout.propTypes = {
  children: PropTypes.element.isRequired,
  currentUser: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  selectedWeek: PropTypes.number
};

export default createContainer(() => {
  const currentUser = User.findOne(Meteor.userId()),
      nextGameHandle = Meteor.subscribe('nextGame'),
      nextGameReady = nextGameHandle.ready();
  let week, selectedWeek;
  if (nextGameReady) {
    week = currentWeek.call(displayError);
    selectedWeek = currentUser.getSelectedWeek() || week;
    Session.set('currentWeek', week);
    Session.setDefault('selectedWeek', selectedWeek);
  }
  return {
    currentUser,
    selectedWeek
  };
}, AuthedLayout);
