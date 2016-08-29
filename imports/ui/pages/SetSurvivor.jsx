/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { Loading } from './Loading.jsx';
import SurvivorPick from '../components/SurvivorPick.jsx';
import SurvivorModal from '../components/SurvivorModal.jsx';
import { Game, Team, User } from '../../api/schema';

class SetSurvivor extends Component {
  constructor(props) {
    super();
    this.state = {
      modalWeek: false
    };
    this._setModalWeek = this._setModalWeek.bind(this);
  }

  componentWillMount() {
    const { survivorPicks = [] } = this.props,
        notAllowed = survivorPicks.length > 0 && survivorPicks.length < 17;
    if (notAllowed) this.context.router.push('/survivor/view');
  }

  _setModalWeek(week, ev) {
    this.setState({ modalWeek: week || false });
  }

  render() {
    const { modalWeek } = this.state,
        { currentWeek, nextGame, nextGameReady, survivorPicks, teams, teamsReady } = this.props,
        weekForSec = nextGame.week - (nextGame.game === 1 ? 1 : 0),
        pageReady = nextGameReady && teamsReady && currentWeek;
    return (
      <div className="row set-survivor-wrapper">
        <Helmet title={`Make Survivor Picks`} />
        {pageReady ? (
          <div className="col-xs-12">
            <h3 className="title-text text-xs-center text-md-left hidden-md-up">Make Survivor Picks</h3>
            <div className="row">
              <div className="col-md-4 hidden-sm-down side-bar">
                {teams.map((team, i) => {
                  const weekIndex = survivorPicks.findIndex((pick, i) => team._id === pick.pick_id);
                  return (
                    <div className="col-md-3 col-xs-2" key={'team' + i}>
                      <div className="text-xs-center survivor-logo">
                        <img src={`/NFLLogos/${team.logo}`} className={(weekIndex !== -1 ? 'used' : '')} />
                        {weekIndex !== -1 ? <span className="tag tag-default when-picked">{weekIndex + 1}</span> : null}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="col-md-7 offset-md-5 col-xs-12">
                <table className="table table-hover set-survivor-table">
                  <thead className="thead-default">
                    <tr>
                      <th className="text-xs-center">Week</th>
                      <th className="text-xs-center">Pick</th>
                    </tr>
                  </thead>
                  <tbody>
                    {survivorPicks.map((pick, i) => (
                      <tr key={'survivor' + i}>
                        <td className="text-xs-right">
                          {pick.winner_id ? (pick.pick_id === pick.winner_id ? <i className="fa fa-fw fa-lg fa-check text-success" /> : <i className="fa fa-fw fa-lg fa-times text-danger" />) : null}
                          {pick.week}
                        </td>
                        <td className="text-xs-left">
                          {pick.week > weekForSec ? (
                            <button type="button" className={'btn btn-' + (pick.pick_id ? 'success is-picked' : (pick.week === currentWeek ? 'danger' : 'primary'))} onClick={this._setModalWeek.bind(null, pick.week)}>
                              <i className="fa fa-fw fa-large fa-pencil-square-o" />
                              &nbsp; Pick Team
                            </button>
                          )
                          :
                            null
                          }
                          {pick.pick_id ? <SurvivorPick pick={pick} /> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {modalWeek ? (
                  <SurvivorModal
                    pick={survivorPicks[modalWeek - 1]}
                    usedTeams={survivorPicks.filter(pick => pick.pick_id).map(pick => pick.pick_id)}
                    week={modalWeek}
                    _setModalWeek={this._setModalWeek} />
                  )
                  :
                  null
                }
              </div>
            </div>
          </div>
        )
        :
          <Loading />
        }
      </div>
    );
  }
}

SetSurvivor.propTypes = {
  currentWeek: PropTypes.number,
  nextGame: PropTypes.object,
  survivorPicks: PropTypes.arrayOf(PropTypes.object).isRequired,
  teams: PropTypes.arrayOf(PropTypes.object).isRequired,
  teamsReady: PropTypes.bool.isRequired
};

SetSurvivor.contextTypes = {
  router: PropTypes.object.isRequired
}

export default createContainer(() => {
  const user = User.findOne(Meteor.userId()),
      currentWeek = Session.get('currentWeek'),
      survivorPicks = user.survivor,
      nextGameHandle = Meteor.subscribe('nextGameToStart'),
      nextGameReady = nextGameHandle.ready(),
      teamsHandle = Meteor.subscribe('nflTeams'),
      teamsReady = teamsHandle.ready();
  let nextGame = {},
      teams = [];
  if (nextGameReady) {
    nextGame = Game.find({ status: { $eq: 'P' }, game: { $ne: 0 }}, { sort: { kickoff: 1 }}).fetch()[0];
  }
  if (teamsReady) {
    teams = Team.find({ short_name: { $nin: ['TIE', 'BON'] }}).fetch();
  }
  return {
    currentWeek,
    nextGame,
    nextGameReady,
    survivorPicks,
    teams,
    teamsReady
  };
}, SetSurvivor);
