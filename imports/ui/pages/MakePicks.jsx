/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { Game, User } from '../../api/schema';
import { displayError } from '../../api/global';

class MakePicks extends Component {
  constructor(props) {
    super();
    this.state = {};
  }

  render() {
    const { currentWeek, games, selectedWeek } = this.props,
        notAllowed = selectedWeek < currentWeek;
    return (
      <div>
        <Helmet title={`Set week ${selectedWeek} picks`} />
        <h3>Make Picks</h3>
        {`${games.length} games in week ${selectedWeek}`}
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
  tiebreaker: PropTypes.object.isRequired
};

export default createContainer(() => {
  const user = User.findOne(Meteor.userId()),
      currentWeek = Session.get('currentWeek'),
      selectedWeek = Session.get('selectedWeek'),
      picks = user.picks.filter(pick => pick.week === (selectedWeek - 1)),
      tiebreaker = user.tiebreakers[selectedWeek - 1],
      gamesHandle = Meteor.subscribe('gamesForWeek', selectedWeek),
      gamesReady = gamesHandle.ready();
  let games = [];
  if (gamesReady) {
    games = Game.find({ week: selectedWeek, game: { $ne: 0 }}).fetch();
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
