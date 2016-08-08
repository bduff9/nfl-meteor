/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import './MakePicks.scss';
import { Loading } from './Loading.jsx';
import PointHolder from '../components/PointHolder.jsx';
import { Game, User } from '../../api/schema';

class MakePicks extends Component {
  constructor(props) {
    const { games, gamesReady, picks } = props;
    super();
    this.state = this._populatePoints(games, picks, gamesReady);
  }

  componentWillReceiveProps(nextProps) {
    const { games, gamesReady, picks } = nextProps;
    let pointObj;
    if (gamesReady) {
      pointObj = this._populatePoints(games, picks, true);
      this.setState(pointObj);
    }
  }

  _populatePoints(games, picks, gamesReady) {
    if (!gamesReady) return { available: [], unavailable: [], used: [] };
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

  render() {
    const { available, unavailable, used } = this.state,
        { currentWeek, games, gamesReady, picks, selectedWeek, teamsReady } = this.props,
        sortOpts = {
         model: 'points',
         group: 'picks',
         sort: false,
         filter: '.disabled',
         onMove: this._validatePointDrop
        },
        pageReady = gamesReady && teamsReady,
        notAllowed = selectedWeek < currentWeek;
    return (
      <div className="row">
        <Helmet title={`Set Week ${selectedWeek} Picks`} />
        {pageReady ? (
          <div className="col-xs-12">
            <h3>{`Set Week ${selectedWeek} Picks`}</h3>
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
                  return (
                    <tr className={(homePicked || visitorPicked ? 'done' : '') + (started ? ' disabled' : '')} title={(started ? 'This game has already begun, no changes allowed' : null)} key={'game' + i}>
                      <td>
                        <div className="row">
                          <div className="col-xs-2 homePoints">
                            {homePicked || !started ? (
                              <PointHolder
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
                          <div className="col-xs-2 homeLogo"><img src={`/NFLLogos/${homeTeam.logo}`} /></div>
                          <div className="col-xs-2 homeName">{`${homeTeam.city} ${homeTeam.name}`}</div>
                          <div className="col-xs-2 visitorName">{`${visitTeam.city} ${visitTeam.name}`}</div>
                          <div className="col-xs-2 visitorLogo"><img src={`/NFLLogos/${visitTeam.logo}`} /></div>
                          <div className="col-xs-2 visitorPoints">
                            {visitorPicked || !started ? (
                              <PointHolder
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
  teamsReady: PropTypes.bool.isRequired,
  tiebreaker: PropTypes.object
};

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
