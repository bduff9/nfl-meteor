/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import './SetSurvivor.scss';
import { Loading } from './Loading.jsx';
import { Game, User } from '../../api/schema';
import { displayError } from '../../api/global';

class SetSurvivor extends Component {
  constructor(props) {
    super();
    this.state = {};
  }

  render() {
    const pageReady = true;
    return (
      <div className="row">
        <Helmet title={`Make Survivor Picks`} />
        {pageReady ? (
          <h3>Make Survivor Picks</h3>
        )
        :
          <Loading />
        }
      </div>
    );
  }
}

SetSurvivor.propTypes = {
  currentWeek: PropTypes.number.isRequired,
  nextGame: PropTypes.object,
  survivorPicks: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default createContainer(() => {
  const user = User.findOne(Meteor.userId()),
      currentWeek = Session.get('currentWeek'),
      survivorPicks = user.survivor,
      nextGame = Game.find({ status: { $ne: 'C' }, game: { $ne: 0 }}, { sort: { kickoff: 1 }}).fetch()[0];
  return {
    currentWeek,
    nextGame,
    survivorPicks
  };
}, SetSurvivor);
