/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';

class ScoreBoard extends Component {
  constructor(props) {
    super();
    this.state = {};
  }

  render() {
    return (
      <div className="scoreboard">
        Scoreboard for current week
      </div>
    );
  }
}

ScoreBoard.propTypes = {};

export default createContainer(() => {
  //TODO figure out how to change weeks
  const currentWeek = Session.get('currentWeek'),
      weekGameHandle = Meteor.subscribe('gamesForWeek', currentWeek),
      weekGameReady = weekGameHandle.ready();
  return {
    currentWeek,
    weekGameReady
  };
}, ScoreBoard);
