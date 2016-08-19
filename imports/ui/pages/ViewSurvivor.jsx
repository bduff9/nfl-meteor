/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import './ViewSurvivor.scss';
import { Loading } from './Loading.jsx';
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
    const { nextGame, pageReady } = nextProps,
        notAllowed = pageReady && nextGame.week === 1 && nextGame.game === 1;
    if (notAllowed) this.context.router.push('/');
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
      <div className="row">
        <Helmet title={`View Survivor Picks`} />
        <h3 className="title-text text-xs-center text-md-left">View Survivor Picks</h3>
        {pageReady ? (
          <div className="col-xs-12 view-survivor-picks">
              View:
              <select className="form-control" value={true} onChange={this._toggleOverall}>
                <option value={true}>Overall</option>
                {nextGame.week > selectedWeek || nextGame.game > 1 ? <option value={false}>{`Week ${selectedWeek}`}</option> : null}
              </select>
              {viewOverall ? 'overall' : 'week'}
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
