/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';

import './ScoreBoard.scss';
import { Game } from '../../api/schema';

class ScoreBoard extends Component {
  constructor(props) {
    super();
    this.state = {};
  }

  render() {
    const { games, week, weekGamesReady, _changeScoreboardWeek } = this.props;
    //TODO showing loading when games not ready
    return (
      <div className="scoreboard">
        <h3 className="text-xs-center">NFL Scoreboard</h3>
        <div className="inner-scoreboard">
          <div className="text-xs-center week-disp">
            <span>{week > 1 ? <i className="fa fa-fw fa-caret-left" onClick={_changeScoreboardWeek.bind(null, week - 1)} /> : null}</span>
            <span>{games.length ? `Week ${week}` : 'No games to display'}</span>
            <span>{week < 17 ? <i className="fa fa-fw fa-caret-right" onClick={_changeScoreboardWeek.bind(null, week + 1)} /> : null}</span>
          </div>
          <div className="scores">
            <table className="table table-condensed table-bordered">
              <tbody>
                {games.map((game, i) => [
                  <tr className="text-xs-center date-head">
                    <td colSpan="3">
                      <u>Sun, Jan 3</u>
                    </td>
                  </tr>,
                  <tr className="away-score">
                    <td>TEAM</td>
                    <td>0</td>
                    <td></td>
                  </tr>,
                  <tr className="home-score">
                    <td>TEAM</td>
                    <td>0</td>
                    <td>F</td>
                  </tr>,
                  <tr className="divider">
                    <td colSpan="3"></td>
                  </tr>
                ])}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

ScoreBoard.propTypes = {
  games: PropTypes.arrayOf(PropTypes.object).isRequired,
  week: PropTypes.number.isRequired,
  weekGamesReady: PropTypes.bool.isRequired,
  _changeScoreboardWeek: PropTypes.func.isRequired
};

export default createContainer(({ week, _changeScoreboardWeek }) => {
  const weekGameHandle = Meteor.subscribe('gamesForWeek', week),
      weekGamesReady = weekGameHandle.ready();
  let games = [];
  if (weekGamesReady) {
    games = Game.find({ week, game: { $ne: 0 }}, { sort: { kickoff: 1 }}).fetch();
  }
  return {
    games,
    week,
    weekGamesReady,
    _changeScoreboardWeek
  };
}, ScoreBoard);
