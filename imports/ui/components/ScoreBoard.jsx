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

ScoreBoard.propTypes = {
  week: PropTypes.number.isRequired,
  weekGamesReady: PropTypes.bool.isRequired,
  _changeScoreboardWeek: PropTypes.func.isRequired
};

export default createContainer(({ week, _changeScoreboardWeek }) => {
  //TODO figure out how to change weeks
  const weekGameHandle = Meteor.subscribe('gamesForWeek', week),
      weekGamesReady = weekGameHandle.ready();
  return {
    week,
    weekGamesReady,
    _changeScoreboardWeek
  };
}, ScoreBoard);
