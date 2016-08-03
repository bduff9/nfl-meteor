/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { Loading } from './Loading.jsx';
import { Game, User } from '../../api/schema';
import { displayError } from '../../api/global';

class MakePicks extends Component {
  constructor(props) {
    super();
    this.state = {
      available: [],
      unavailable: [],
      used: []
    };
  }

  componentWillReceiveProps(nextProps) {
    const { games, gamesReady, picks } = nextProps;
    let pointObj;
    if (gamesReady) {
      pointObj = this._populatePoints(games, picks);
      this.setState(pointObj);
    }
  }

  _populatePoints(games, picks) {
    const used = picks.map(pick => pick.points).filter(points => points),
        missedGames = picks.filter((pick, i) => !pick.points && games[i].kickoff <= new Date());
    let available = [],
        unavailable = [];
    for (let i = 1; i <= games.length; i++) {
      if (used.indexOf(i) === -1) available.push(i);
    }
    if (missedGames.length) unavailable = available.splice(available.length - missedGames.length, missedGames.length);
    return { available, unavailable, used };
  }
  _getColor(point, max) {
    const BLUE = 0;
    let style = {},
        perc = point / max,
        red = parseInt((1 - perc) * 510, 10),
        green = parseInt(510 * perc, 10);
    green = (green > 255 ? 255 : green);
    red = (red > 255 ? 255 : red);
    style.backgroundColor = `rgb(${red}, ${green}, ${BLUE})`;
    return style;
  }
  _renderGames() {
    //TODO will prob be separate component
  }

  render() {
    const { available, unavailable, used } = this.state,
        { currentWeek, games, gamesReady, selectedWeek } = this.props,
        notAllowed = selectedWeek < currentWeek;
    return (
      <div>
        <Helmet title={`Set week ${selectedWeek} picks`} />
        {gamesReady ? (
          <div>
            <h3>Make Picks</h3>
            {available.map(point => <div className="points" style={this._getColor(point, games.length)} key={'point' + point}>{point}</div>)}
            <ul>
              {games.map((game, i) => (
                <li key={'game' + i}>{`${game.visitor_short} @ ${game.home_short}`}</li>
              ))}
            </ul>
          </div>
          )
          :
          <Loading />
        }
      </div>
    );
  }
}

MakePicks.propTypes = {
  currentWeek: PropTypes.number,
  games: PropTypes.arrayOf(PropTypes.object).isRequired,
  gamesReady: PropTypes.bool.isRequired,
  picks: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedWeek: PropTypes.number,
  tiebreaker: PropTypes.object
};

export default createContainer(() => {
  const user = User.findOne(Meteor.userId()),
      currentWeek = Session.get('currentWeek'),
      selectedWeek = Session.get('selectedWeek'),
      picks = user.picks.filter(pick => pick.week === selectedWeek && pick.game !== 0),
      tiebreaker = user.tiebreakers[selectedWeek - 1],
      gamesHandle = Meteor.subscribe('gamesForWeek', selectedWeek),
      gamesReady = gamesHandle.ready();
  let games = [];
  if (gamesReady) {
    games = Game.find({ week: selectedWeek, game: { $ne: 0 }}, { sort: { game: 1 }}).fetch();
  }
  return {
    currentWeek,
    selectedWeek,
    picks,
    tiebreaker,
    gamesReady,
    games
  };
}, MakePicks);
