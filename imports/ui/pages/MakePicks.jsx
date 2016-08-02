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
    this.state = {};
    this._renderPoints = this._renderPoints.bind(this);
  }

  _renderPoints() {
//TODO should this be separate component?
    const { games, picks } = this.props,
        usedPoints = picks.map(pick => pick.points).filter(points => points),
        missedGames = picks.filter((pick, i) => !pick.points && games[i].kickoff <= new Date());
    let pointDivs = [];
    for (let i = 1; i <= games.length; i++) {
      if (usedPoints.indexOf(i) === -1) pointDivs.push(<div key={'point' + i}>{i}</div>);
    }
    if (missedGames.length) pointDivs.length = pointDivs.length - missedGames.length;
    return pointDivs;
  }
  _renderGames() {
    //TODO will prob be separate component
  }

  render() {
    const { currentWeek, games, gamesReady, selectedWeek } = this.props,
        notAllowed = selectedWeek < currentWeek;
    return (
      <div>
        <Helmet title={`Set week ${selectedWeek} picks`} />
        {gamesReady ? (
          <div>
            <h3>Make Picks</h3>
            {this._renderPoints()}
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
