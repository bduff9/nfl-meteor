/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import './AuthedLayout.scss';
import { User } from '../../api/schema';
import Navigation from '../components/Navigation.jsx';
import { RightSlider } from '../components/RightSlider.jsx';
import { currentWeek } from '../../api/collections/games';
import { displayError } from '../../api/global';

class AuthedLayout extends Component {
  constructor(props) {
    const { currentUser } = props;
    super();
    this.state = {
      openMenu: false,
      rightSlider: '',
      scoreboardWeek: props.currentWeek
    };
    this._changeScoreboardWeek = this._changeScoreboardWeek.bind(this);
    this._toggleMenu = this._toggleMenu.bind(this);
    this._toggleRightSlider = this._toggleRightSlider.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    this.setState({ openMenu: false });
  }

  _changeScoreboardWeek(newWeek, ev) {
    this.setState({ scoreboardWeek: newWeek });
  }
  _toggleMenu(ev) {
    const { openMenu } = this.state;
    this.setState({ openMenu: !openMenu });
  }
  _toggleRightSlider(type, ev) {
    const { openMenu, rightSlider } = this.state;
    let newType = (type === rightSlider ? '' : type);
    ev.preventDefault();
    this.setState({ openMenu: (newType ? false : openMenu), rightSlider: newType });
    return false;
  }

  render() {
    const { openMenu, rightSlider, scoreboardWeek } = this.state,
        { children, currentWeek, location, ...rest } = this.props,
        logoutOnly = location.pathname.indexOf('create') > -1;
    return (
      <div className="col-xs-12">
        <div className="row">
          <Helmet title="Welcome" />
          <i className="fa fa-large fa-bars hidden-sm-up mobile-menu" onClick={this._toggleMenu} />
          <Navigation {...rest}
            currentWeek={currentWeek}
            logoutOnly={logoutOnly}
            openMenu={openMenu}
            rightSlider={rightSlider}
            _toggleMenu={this._toggleMenu}
            _toggleRightSlider={this._toggleRightSlider} />
          <div className="col-xs-12 col-sm-9 offset-sm-3 col-lg-10 offset-lg-2 main">{children}</div>
        </div>
        <ReactCSSTransitionGroup transitionName="right-slider" transitionEnterTimeout={1000} transitionLeaveTimeout={1000}>
          {rightSlider ? (
            <RightSlider
              type={rightSlider}
              week={scoreboardWeek || currentWeek}
              _changeScoreboardWeek={this._changeScoreboardWeek}
              _toggleRightSlider={this._toggleRightSlider} key={'right-slider-' + rightSlider} />
            )
            :
            null
          }
        </ReactCSSTransitionGroup>
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
  let selectedWeek = Session.get('selectedWeek'),
      week;
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
