/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';

import { Navigation } from '../components/navigation.jsx';
import { currentWeek } from '../../api/collections/games';
import { displayError } from '../../api/global';

class AuthedLayout extends Component {
  constructor(props) {
    super();
    this.state = {};
  }

  render() {
    const { children, location } = this.props,
        logoutOnly = location.pathname.indexOf('create') > -1;
    return (
      <div>
        <Navigation logoutOnly={logoutOnly} />
        {children}
      </div>
    );
  }
}

AuthedLayout.propTypes = {
  children: PropTypes.element.isRequired,
  location: PropTypes.object.isRequired
};

export default createContainer(() => {
  const nextGameHandle = Meteor.subscribe('nextGame'),
      nextGameReady = nextGameHandle.ready();
  let week = currentWeek.call(displayError);
  if (nextGameReady) {
    Session.set('currentWeek', week);
    Session.setDefault('selectedWeek', week);
  }
  return {};
}, AuthedLayout);
