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
import { removePick, setPick } from '../../api/collections/users';
import { displayError } from '../../api/global';

class MakePicks extends Component {
  constructor(props) {
    const { games, gamesReady, picks } = props;
    let state;
    super();
    state = this._populatePoints(games, picks, gamesReady);
    //state.sortable = this._bindSortable(null, games);
    this.state = state;
    this._bindSortable = this._bindSortable.bind(this);
    this._handlePointAdd = this._handlePointAdd.bind(this);
    this._handlePointRemove = this._handlePointRemove.bind(this);
  }

  componentDidMount() {
    const { sortable } = this.state,
        { games } = this.props;
    this.setState({ sortable: this._bindSortable(sortable, games) });
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
    const { available, sortable, used } = this.state,
        { games } = this.props;
    if (this.refs.pointBank && (!sortable || sortable.length !== ((available.length + used.length) * 2 + 1))) this.setState({ sortable: this._bindSortable(sortable, games) });
  }

  _bindSortable(sortable, games) {
    const opts = {
          group: 'picks',
          sort: false,
          filter: '.disabled',
          onMove: this._validatePointDrop
        };
    let newSortable = (sortable ? sortable.map(sort => sort) : []),
        team, ul;
    if (!this.refs.pointBank) return null;
    newSortable.forEach(sort => sort.destroy());
    newSortable.length = 0;
    newSortable.push(Sortable.create(this.refs.pointBank, opts));
    opts.onAdd = this._handlePointAdd;
    opts.onRemove = this._handlePointRemove;
    games.forEach(game => {
      team = game.home_short;
      ul = this.refs[team];
      if (ul && !Sortable.utils.is(ul, '.disabled')) {
        newSortable.push(Sortable.create(this.refs[team], opts));
      }
      team = game.visitor_short;
      ul = this.refs[team];
      if (ul && !Sortable.utils.is(ul, '.disabled')) {
        newSortable.push(Sortable.create(this.refs[team], opts));
      }
    });
    return newSortable;
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
  _validatePointDrop(ev) {
    const { dragged, to } = ev;
    let usedPoints;
    if (Sortable.utils.is(to, '.pointBank')) return true;
    if (Sortable.utils.is(to, '.disabled')) return false;
    if (to.children.length > 0) return false;
    usedPoints = Sortable.utils.find(Sortable.utils.closest(to, '.row'), 'li');
    usedPoints = Array.from(usedPoints).filter(point => Sortable.utils.is(point, '.points') && point !== dragged);
    return usedPoints.length === 0;
  }
  _handlePointAdd(ev) {
    const { item, to } = ev,
        { selectedWeek } = this.props,
        gameId = to.dataset.gameId,
        teamId = to.dataset.teamId,
        teamShort = to.dataset.teamShort,
        pointVal = parseInt(item.innerText, 10);
    setPick.call({ selectedWeek, gameId, teamId, teamShort, pointVal }, displayError);
  }
  _handlePointRemove(ev) {
    const { from, item } = ev,
        { selectedWeek } = this.props,
        gameId = from.dataset.gameId,
        teamId = from.dataset.teamId,
        teamShort = from.dataset.teamShort,
        pointVal = parseInt(item.innerText, 10);
    removePick.call({ selectedWeek, gameId, teamId, teamShort, pointVal }, displayError);
  }

  render() {
    const { available, unavailable, used } = this.state,
        { currentWeek, games, gamesReady, picks, selectedWeek, teamsReady } = this.props,
        pageReady = gamesReady && teamsReady,
        notAllowed = selectedWeek < currentWeek;
    return (
      <div className="row">
        <Helmet title={`Set Week ${selectedWeek} Picks`} />
        {pageReady ? (
          <div className="col-xs-12">
            <h3>{`Set Week ${selectedWeek} Picks`}</h3>
            <ul className="pointBank" ref="pointBank">
              {available.map(point => <li className="points text-xs-center" style={this._getColor(point, games.length)} key={'point' + point}>{point}</li>)}
              {unavailable.map(point => <li className="points text-xs-center disabled" title="This is unavailable" style={this._getColor(point, games.length)} key={'point' + point}>{point}</li>)}
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
                      homePicked = thisPick.pick_id === homeTeam._id,
                      visitorPicked = thisPick.pick_id === visitTeam._id,
                      started = game.kickoff <= new Date();
                  return (
                    <tr className={(homePicked || visitorPicked ? 'done' : '') + (started ? ' disabled' : '')} title={(started ? 'This game has already begun, no changes allowed' : null)} key={'game' + i}>
                      <td>
                        <div className="row">
                          <div className="col-xs-2 homePoints">
                            {homePicked || !started ? (
                              <ul data-game-id={game._id} data-team-id={homeTeam._id} data-team-short={homeTeam.short_name} ref={homeTeam.short_name}>
                                {homePicked ? <li className={'points text-xs-center' + (started ? ' disabled' : '')} style={this._getColor(thisPick.points, games.length)}>{thisPick.points}</li> : null}
                              </ul>
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
                              <ul data-game-id={game._id} data-team-id={visitTeam._id} data-team-short={visitTeam.short_name} ref={visitTeam.short_name}>
                                {visitorPicked ? <li className={'points text-xs-center' + (started ? ' disabled' : '')} style={this._getColor(thisPick.points, games.length)}>{thisPick.points}</li> : null}
                              </ul>
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
