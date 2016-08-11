/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { User } from '../../api/schema';
import { Navigation } from '../components/Navigation.jsx';
import { RightSlider } from '../components/RightSlider.jsx';
import { currentWeek } from '../../api/collections/games';
import { displayError } from '../../api/global';

class AuthedLayout extends Component {
  constructor(props) {
    super();
    this.state = {
      rightSlider: ''
    };
    this._toggleRightSlider = this._toggleRightSlider.bind(this);
  }

  _toggleRightSlider(type, ev) {
    const { rightSlider } = this.state;
    let newType = (type === rightSlider ? '' : type);
    ev.preventDefault();
    this.setState({ rightSlider: newType });
    return false;
  }

  render() {
    const { rightSlider } = this.state,
        { children, location, ...rest } = this.props,
        logoutOnly = location.pathname.indexOf('create') > -1;
    return (
      <div className="col-xs">
        <div className="row">
          <Helmet title="Welcome" />
          <Navigation {...rest} logoutOnly={logoutOnly} _toggleRightSlider={this._toggleRightSlider} />
          <div className="col-sm-9 offset-sm-3 col-md-10 offset-md-2 main">{children}</div>
        </div>
        {rightSlider !== '' ? <RightSlider type={rightSlider} /> : null}
      </div>
    );
  }
}

AuthedLayout.propTypes = {
  children: PropTypes.element.isRequired,
  currentUser: PropTypes.object.isRequired,
  currentWeek: PropTypes.number,
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
    currentWeek: week,
    selectedWeek
  };
}, AuthedLayout);
