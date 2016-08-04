/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { Loading } from './Loading.jsx';
import { Game, User } from '../../api/schema';
import { displayError } from '../../api/global';

class ViewPicks extends Component {
  constructor(prop) {
    super();
    this.state = {};
  }

  render() {
    const { games, gamesReady, picks, selectedWeek, teamsReady } = this.props,
        pageReady = gamesReady && teamsReady;
    return (
      <div>
        <Helmet title={`View My Picks for Week ${selectedWeek}`} />
        <h3>{`View My Picks for Week ${selectedWeek}`}</h3>
        {pageReady ? (
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Games</th>
                <th>My Pick</th>
                <th>Wager</th>
                <th>Winner</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game, i) => {
                const homeTeam = game.getTeam('home'),
                    visitTeam = game.getTeam('visitor'),
                    thisPick = picks[i];
                return (
                  <tr key={'game' + i}>
                    <td>{`${visitTeam.city} ${visitTeam.name} @ ${homeTeam.city} ${homeTeam.name}`}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          )
          :
          <Loading />
        }
      </div>
    );
  }
}

ViewPicks.propTypes = {
  games: PropTypes.arrayOf(PropTypes.object).isRequired,
  gamesReady: PropTypes.bool.isRequired,
  picks: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedWeek: PropTypes.number,
  teamsReady: PropTypes.bool.isRequired,
  tiebreaker: PropTypes.object
};

export default createContainer(() => {
  const user = User.findOne(Meteor.userId()),
      selectedWeek = Session.get('selectedWeek'),
      picks = user.picks.filter(pick => pick.week === selectedWeek && pick.game !== 0),
      tiebreaker = user.tiebreakers[selectedWeek - 1],
      gamesHandle = Meteor.subscribe('gamesForWeek', selectedWeek),
      gamesReady = gamesHandle.ready(),
      teamsHandle = Meteor.subscribe('allTeams'),
      teamsReady = teamsHandle.ready();
  let games = [];
  if (gamesReady) {
    games = Game.find({ week: selectedWeek, game: { $ne: 0 }}, { sort: { game: 1 }}).fetch();
  }
  return {
    games,
    gamesReady,
    picks,
    selectedWeek,
    teamsReady,
    tiebreaker
  };
}, ViewPicks);
