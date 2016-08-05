/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';
import Sortable from 'sortablejs';

import './MakePicks.scss';
import { Loading } from './Loading.jsx';
import { Game, User } from '../../api/schema';
import { displayError } from '../../api/global';

class MakePicks extends Component {
  constructor(props) {
    super();
    this.state = this._populatePoints(props.games, props.picks, props.gamesReady);
  }

  componentWillReceiveProps(nextProps) {
    const { games, gamesReady, picks } = nextProps;
    let pointObj;
    if (gamesReady) {
      pointObj = this._populatePoints(games, picks, true);
      this.setState(pointObj);
    }
  }
  componentDidUpdate(prevProps, prevState) {
    const { sortable } = this.state,
        { games } = this.props,
        opts = {
          group: 'picks',
          sort: false,
          filter: '.disabled'
        };
    let newSortable = sortable || {},
        team;
    if (!sortable && this.refs.pointBank) {
      newSortable.bank = Sortable.create(this.refs.pointBank, opts);
//TODO disable games that have started
      opts.onMove = this._handlePointDrop;
      opts.onSort = this._handlePointDrop;
      games.forEach(game => {
        team = game.home_short;
        newSortable[team] = Sortable.create(this.refs[team], opts);
        team = game.visitor_short;
        newSortable[team] = Sortable.create(this.refs[team], opts);
      });
      this.setState({ sortable: newSortable });
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
  _handlePointDrop(ev) {
console.log(ev);
//TODO only allow one per ul
//TODO only allow one per game
//TODO on add write to pick
//TODO on remove, remove from pick
    ev.preventDefault();
    ev.stopPropagation();
    return false;
  }

  render() {
    const { available, unavailable, used } = this.state,
        { currentWeek, games, gamesReady, picks, selectedWeek, teamsReady } = this.props,
        pageReady = gamesReady && teamsReady,
        notAllowed = selectedWeek < currentWeek;
    return (
      <div>
        <Helmet title={`Set Week ${selectedWeek} Picks`} />
        {pageReady ? (
          <div>
            <h3>{`Set Week ${selectedWeek} Picks`}</h3>
            <ul className="pointBank" ref="pointBank">
              {available.map(point => <li className="points text-xs-center" style={this._getColor(point, games.length)} key={'point' + point}>{point}</li>)}
            </ul>
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
                      started = game.kickoff >= new Date();
//TODO use started to disable points/uls
                  return (
                    <tr key={'game' + i}>
                      <td>
                        <div className="row">
                          <div className="col-xs-2 homePoints">
                            <ul ref={homeTeam.short_name}>
                              {thisPick.pick_id === homeTeam._id ? <li className="points text-xs-center" style={this._getColor(thisPick.points, games.length)}>{thisPick.points}</li> : null}
                            </ul>
                          </div>
                          <div className="col-xs-2 homeLogo"><img src={`/NFLLogos/${homeTeam.logo}`} /></div>
                          <div className="col-xs-2 homeName">{`${homeTeam.city} ${homeTeam.name}`}</div>
                          <div className="col-xs-2 visitorName">{`${visitTeam.city} ${visitTeam.name}`}</div>
                          <div className="col-xs-2 visitorLogo"><img src={`/NFLLogos/${visitTeam.logo}`} /></div>
                          <div className="col-xs-2 visitorPoints">
                            <ul ref={visitTeam.short_name}>
                              {thisPick.pick_id === visitTeam._id ? <li className="points text-xs-center" style={this._getColor(thisPick.points, games.length)}>{thisPick.points}</li> : null}
                            </ul>
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
