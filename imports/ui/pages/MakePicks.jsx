/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import './MakePicks.scss';
import { Loading } from './Loading.jsx';
import PointHolder from '../components/PointHolder.jsx';
import TeamHover from '../components/TeamHover.jsx';
import { Game, User } from '../../api/schema';
import { autoPick, resetPicks, setTiebreaker, submitPicks } from '../../api/collections/users';
import { displayError } from '../../api/global';

class MakePicks extends Component {
  constructor(props) {
    const { games, gamesReady, picks } = props;
    super();
    this.state = this._populatePoints(games, picks, gamesReady);
    this._autopick = this._autopick.bind(this);
    this._resetPicks = this._resetPicks.bind(this);
    this._setHover = this._setHover.bind(this);
    this._setTiebreakerWrapper = this._setTiebreakerWrapper.bind(this);
    this._submitPicks = this._submitPicks.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { currentWeek, games, gamesReady, picks, selectedWeek, tiebreaker } = nextProps,
        notAllowed = selectedWeek < currentWeek || !tiebreaker || tiebreaker.submitted;
    let pointObj;
    if (notAllowed) this.context.router.push('/picks/view');
    if (gamesReady) {
      pointObj = this._populatePoints(games, picks, true);
      this.setState(pointObj);
    }
  }

  _populatePoints(games, picks, gamesReady) {
    if (!gamesReady) return { available: [], unavailable: [], used: [] };
    const used = picks.filter(pick => pick.points && pick.pick_id).map(pick => pick.points),
        missedGames = picks.filter((pick, i) => !pick.pick_id && games[i].kickoff <= new Date());
    let available = [],
        unavailable = [];
    for (let i = 1; i <= games.length; i++) {
      if (used.indexOf(i) === -1) available.push(i);
    }
    if (missedGames.length) unavailable = available.splice(available.length - missedGames.length, missedGames.length);
    return { available, unavailable, used };
  }
  _setHover(hoverTeam, ev) {
    this.setState({ hoverTeam, hoverOn: (hoverTeam ? ev.target : null) });
  }
  _setTiebreakerWrapper(ev) {
    const { selectedWeek } = this.props,
        lastScoreStr = ev.currentTarget.value,
        lastScore = (lastScoreStr ? parseInt(lastScoreStr, 10) : 0);
    setTiebreaker.call({ selectedWeek, lastScore }, displayError);
  }
  _resetPicks(ev) {
    const { selectedWeek } = this.props;
    resetPicks.call({ selectedWeek }, displayError);
    Bert.alert({ type: 'success', message: 'Your picks have been reset!' });
  }
  _autopick(type, ev) {
    const { available } = this.state,
        { selectedWeek } = this.props;
    ev.preventDefault();
    autoPick.call({ selectedWeek, type, available }, displayError);
    Bert.alert({ type: 'success', message: `Your unset picks have been automatically set ${type === 'random' ? 'randomly' : `to the ${type} teams`}!` });
    return false;
  }
  _savePicks(ev) {
    ev.currentTarget.disabled = true;
    Bert.alert({ type: 'success', message: 'Your picks have been successfully saved!' });
  }
  _submitPicks(ev) {
    const { selectedWeek } = this.props;
    ev.preventDefault();
    submitPicks.call({ selectedWeek }, displayError);
    Bert.alert({ type: 'success', message: 'Your picks have been submitted!' });
    return false;
  }

  render() {
    const { available, hoverOn, hoverTeam, unavailable, used } = this.state,
        { currentWeek, games, gamesReady, picks, selectedWeek, teamsReady, tiebreaker } = this.props,
        sortOpts = {
         model: 'points',
         group: 'picks',
         sort: false,
         filter: '.disabled',
         onMove: this._validatePointDrop
        },
        pageReady = gamesReady && teamsReady;
    let lastHomeTeam, lastVisitingTeam;
    return (
      <div className="row">
        <Helmet title={`Set Week ${selectedWeek} Picks`} />
        {pageReady ? [
            <div className="col-xs-12" key="picks">
              <h3 className="text-xs-center text-md-left">{`Set Week ${selectedWeek} Picks`}</h3>
              <PointHolder
                className="pointBank"
                disabledPoints={unavailable}
                numGames={games.length}
                points={available}
                selectedWeek={selectedWeek}
                thisRef="pointBank" />
              <table className="table table-hover makePickTable">
                <thead className="thead-default">
                  <tr>
                    <th>
                      <div className="row">
                        <div className="col-xs-6 text-xs-center">Home</div>
                        <div className="col-xs-6 text-xs-center">Away</div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((game, i) => {
                    const homeTeam = game.getTeam('home'),
                        visitTeam = game.getTeam('visitor'),
                        thisPick = picks[i],
                        homePicked = thisPick.pick_id === homeTeam._id,
                        visitorPicked = thisPick.pick_id === visitTeam._id,
                        started = game.kickoff <= new Date();
                    lastHomeTeam = homeTeam;
                    lastVisitingTeam = visitTeam;
                    return (
                      <tr className={(homePicked || visitorPicked ? 'done' : '') + (started ? ' disabled' : '')} title={(started ? 'This game has already begun, no changes allowed' : null)} key={'game' + i}>
                        <td>
                          <div className="row">
                            <div className="col-xs-6 col-md-2 homePoints">
                              {homePicked || !started ? (
                                <PointHolder
                                  className="pull-xs-left"
                                  disabledPoints={homePicked && started ? [thisPick.points] : []}
                                  gameId={game._id}
                                  numGames={games.length}
                                  points={homePicked && !started ? [thisPick.points] : []}
                                  selectedWeek={selectedWeek}
                                  teamId={homeTeam._id}
                                  teamShort={homeTeam.short_name}
                                  thisRef={homeTeam.short_name} />
                                )
                                :
                                null
                              }
                            </div>
                            <div className="col-xs-6 col-md-2 text-xs-center text-md-left homeLogo"><img src={`/NFLLogos/${homeTeam.logo}`} /></div>
                            <div className="col-xs-6 col-md-2 text-xs-center text-md-left homeName">
                              {`${homeTeam.city} ${homeTeam.name} `}
                              <i className="text-primary hidden-xs-down fa fa-info-circle team-hover-link" onMouseEnter={this._setHover.bind(null, homeTeam._id)} onMouseLeave={this._setHover.bind(null, '')} />
                            </div>
                            <div className="col-xs-6 col-md-2 text-xs-center text-md-right visitorName">
                              <i className="text-primary hidden-xs-down fa fa-info-circle team-hover-link" onMouseEnter={this._setHover.bind(null, visitTeam._id)} onMouseLeave={this._setHover.bind(null, '')} />
                              {` ${visitTeam.city} ${visitTeam.name}`}
                            </div>
                            <div className="col-xs-6 col-md-2 text-xs-center text-md-right visitorLogo"><img src={`/NFLLogos/${visitTeam.logo}`} /></div>
                            <div className="col-xs-6 col-md-2 visitorPoints">
                              {visitorPicked || !started ? (
                                <PointHolder
                                  className="pull-xs-right"
                                  disabledPoints={visitorPicked && started ? [thisPick.points] : []}
                                  gameId={game._id}
                                  numGames={games.length}
                                  points={visitorPicked && !started ? [thisPick.points] : []}
                                  selectedWeek={selectedWeek}
                                  teamId={visitTeam._id}
                                  teamShort={visitTeam.short_name}
                                  thisRef={visitTeam.short_name} />
                                )
                                :
                                null
                              }
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <table className="table table-hover tiebreakerTable">
                <thead className="thead-default">
                  <tr>
                    <th>Tiebreaker</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{`Without going over, input the total number of points scored in the ${lastVisitingTeam.city} ${lastVisitingTeam.name} vs. ${lastHomeTeam.city} ${lastHomeTeam.name} game`}</td>
                  </tr>
                  <tr>
                    <td>
                      <input type="number" className="form-control" defaultValue={tiebreaker.last_score} onBlur={this._setTiebreakerWrapper} />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>,
            <div className="col-xs-12 col-sm-9 col-md-10 text-xs-center pick-buttons" key="pick-buttons">
              <button type="button" className="btn btn-danger" disabled={used.length === 0} onClick={this._resetPicks}>
                <i className="fa fa-fw fa-refresh hidden-sm-down" /> Reset
              </button>
              <div className="btn-group dropup">
                <button type="button" className="btn btn-warning dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" disabled={available.length === 0}>
                  <i className="fa fa-fw fa-magic hidden-sm-down" /> Auto-Pick
                </button>
                <div className="dropdown-menu">
                  <a className="dropdown-item" href="#" onClick={this._autopick.bind(null, 'home')}>All Home Teams</a>
                  <a className="dropdown-item" href="#" onClick={this._autopick.bind(null, 'away')}>All Away Teams</a>
                  <div className="dropdown-divider"></div>
                  <a className="dropdown-item" href="#" onClick={this._autopick.bind(null, 'random')}>Random</a>
                </div>
              </div>
              <button type="button" className="btn btn-primary" disabled={used.length === 0} onClick={this._savePicks}>
                <i className="fa fa-fw fa-save hidden-sm-down" /> Save
              </button>
              <button type="submit" className="btn btn-success" disabled={available.length !== 0 || !tiebreaker.last_score} onClick={this._submitPicks}>
                <i className="fa fa-fw fa-arrow-circle-right hidden-sm-down" /> Submit
              </button>
            </div>
          ]
          :
          <Loading />
        }
        {hoverTeam ? <TeamHover target={hoverOn} teamId={hoverTeam} /> : null}
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
  teamsReady: PropTypes.bool.isRequired,
  tiebreaker: PropTypes.object
};

MakePicks.contextTypes = {
  router: PropTypes.object.isRequired
}

export default createContainer(() => {
  const user = User.findOne(Meteor.userId()),
      currentWeek = Session.get('currentWeek'),
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
    currentWeek,
    games,
    gamesReady,
    picks,
    selectedWeek,
    teamsReady,
    tiebreaker
  };
}, MakePicks);
