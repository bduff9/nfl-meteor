/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { Loading } from './Loading.jsx';
import OverallSurvivor from '../components/OverallSurvivor.jsx';
import WeekSurvivor from '../components/WeekSurvivor.jsx';
import { Game, Team, User } from '../../api/schema';

class ViewSurvivor extends Component {
  constructor(props) {
    super();
    this.state = {
      viewOverall: true
    };
    this._toggleOverall = this._toggleOverall.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { nextGame, pageReady, selectedWeek } = nextProps,
        notAllowed = pageReady && nextGame.week === 1 && nextGame.game === 1;
    if (notAllowed) this.context.router.push('/');
    if (nextGame.week > selectedWeek || (nextGame.week === selectedWeek && nextGame.game > 1)) this.setState({ viewOverall: true });
  }

  _toggleOverall(ev) {
    const { viewOverall } = this.state;
    this.setState({ viewOverall: !viewOverall });
  }

  render() {
    const { viewOverall } = this.state,
        { nextGame, pageReady, selectedWeek } = this.props,
        weekForSec = nextGame.week - (nextGame.game === 1 ? 1 : 0);
    return (
      <div className="row view-survivor-wrapper">
        <Helmet title={`View Survivor Picks`} />
        <h3 className="title-text text-xs-center text-md-left hidden-md-up">View Survivor Picks</h3>
        {pageReady ? (
          <div className="col-xs-12 view-survivor-picks">
              View:
              <select className="form-control" value={viewOverall} onChange={this._toggleOverall}>
                <option value={true}>Overall</option>
                {nextGame.week > selectedWeek || (nextGame.week === selectedWeek && nextGame.game > 1) ? <option value={false}>{`Week ${selectedWeek}`}</option> : null}
              </select>
              {viewOverall ? <OverallSurvivor weekForSec={weekForSec} /> : <WeekSurvivor week={selectedWeek} weekForSec={weekForSec} />}
          </div>
        )
        :
          <Loading />
        }
      </div>
    );
  }
}

ViewSurvivor.propTypes = {
  nextGame: PropTypes.object,
  pageReady: PropTypes.bool.isRequired,
  selectedWeek: PropTypes.number
};

ViewSurvivor.contextTypes = {
  router: PropTypes.object.isRequired
}

export default createContainer(() => {
  const nextGameHandle = Meteor.subscribe('nextGameToStart'),
      nextGameReady = nextGameHandle.ready(),
      selectedWeek = Session.get('selectedWeek');
  let nextGame = {};
  if (nextGameReady) {
    nextGame = Game.find({ status: { $eq: 'P' }, game: { $ne: 0 }}, { sort: { kickoff: 1 }}).fetch()[0];
  }
  return {
    nextGame,
    pageReady: nextGameReady,
    selectedWeek
  };
}, ViewSurvivor);
