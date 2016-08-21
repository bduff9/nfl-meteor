/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import './ViewAllPicks.scss';
import { Loading } from './Loading.jsx';
import { Game, Team, User } from '../../api/schema';
import { weekPlacer } from '../../api/global';

class ViewAllPicks extends Component {
  constructor(props) {
    super();
    this.state = {
      games: [],
      users: []
    };
    this._resetPicks = this._resetPicks.bind(this);
    this._updateGame = this._updateGame.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const { currentWeek, games, pageReady, selectedWeek, tiebreaker = {}, users } = nextProps,
        notAllowed = pageReady && ((selectedWeek <= currentWeek && tiebreaker.submitted === false) || selectedWeek > currentWeek);
    let gameObj;
    if (notAllowed) this.context.router.push('/picks/set');
    if (pageReady) {
      this.setState({ games: games.map(game => Object.assign({}, game)), users: this._updateUsers(users, games, selectedWeek) });
    }
  }

  _resetPicks(ev) {
    const { games, selectedWeek, users } = this.props;
    this.setState({ games: games.map(game => Object.assign({}, game)), users: this._updateUsers(users, games, selectedWeek) });
  }
  _updateGame(teamId, teamShort, i, ev) {
    const { games } = this.state,
        { selectedWeek, users } = this.props;
    games[i].winner_id = teamId;
    games[i].winner_short = teamShort;
    this.setState({ games, users: this._updateUsers(users, games, selectedWeek) });
  }
  _updateUsers(users, games, selectedWeek) {
    let newUsers = users.map(user => {
      let newUser = Object.assign({}, user),
          picks = newUser.picks.filter(pick => pick.game > 0 && pick.week === selectedWeek),
          tiebreaker = newUser.tiebreakers.filter(tiebreaker => tiebreaker.week)[0],
          pts = 0,
          gms = 0,
          game;
      picks.forEach((pick, i) => {
        game = games[i];
        if (game.winner_id && pick.pick_id === game.winner_id) {
          pts += pick.points;
          gms += 1;
        }
      });
      tiebreaker.points_earned = pts;
      tiebreaker.games_correct = gms;
      return newUser;
    });
    newUsers.sort(weekPlacer.bind(null, selectedWeek));
    newUsers.forEach((user, i, allUsers) => {
      const tiebreaker = user.tiebreakers[selectedWeek - 1];
      let nextUser, result, nextTiebreaker;
      if (!tiebreaker.tied_flag || i === 0) {
        tiebreaker.place_in_week = (i + 1);
      }
      nextUser = allUsers[i + 1];
      if (nextUser) {
        result = weekPlacer(selectedWeek, user, nextUser);
        nextTiebreaker = nextUser.tiebreakers[selectedWeek - 1];
        if (result === 0) {
          tiebreaker.tied_flag = true;
          nextTiebreaker.place_in_week = (i + 1);
          nextTiebreaker.tied_flag = true;
        } else {
          tiebreaker.tied_flag = false;
          nextTiebreaker.tied_flag = false;
        }
      }
    });
    return newUsers;
  }

  render() {
    const { games, users } = this.state,
        { currentUser, pageReady, selectedWeek } = this.props;
    return (
      <div className="row">
        <Helmet title={`View All Week ${selectedWeek} Picks`} />
        <h3 className="title-text text-xs-center text-md-left hidden-md-up">{`View All Week ${selectedWeek} Picks`}</h3>
        {pageReady ? (
          <div className="col-xs-12 text-xs-left view-all-picks">
            <button type="button" className="btn btn-danger reset-picks" onClick={this._resetPicks}>
              <i className="fa fa-fw fa-refresh" />
              Reset Page
            </button>
            <table className="table table-hover view-all-picks-table">
              <thead>
                <tr>
                  <th>Name</th>
                  {games.map((game, i) => {
                    let cells = [];
                    cells.push(
                      <th className={'visiting-team' + (game.visitor_id === game.winner_id ? ' text-success' : (game.winner_id ? ' text-danger' : ''))} colSpan={2} key={'team' + game.visitor_id} onClick={this._updateGame.bind(null, game.visitor_id, game.visitor_short, i)}>{game.visitor_short}</th>
                    );
                    cells.push(
                      <th className="team-separator" colSpan={2} key={'game' + game._id}>@</th>
                    );
                    cells.push(
                      <th className={'home-team' + (game.home_id === game.winner_id ? ' text-success' : (game.winner_id ? ' text-danger' : ''))} colSpan={2} key={'team' + game.home_id} onClick={this._updateGame.bind(null, game.home_id, game.home_short, i)}>{game.home_short}</th>
                    );
                    return cells;
                  })}
                  <th>Points Earned</th>
                  <th>Games Correct</th>
                  <th>My Tiebreaker Score</th>
                  <th>Last Game Score</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const tiebreaker = user.tiebreakers.filter(tiebreaker => tiebreaker.week === selectedWeek)[0];
                  return (
                    <tr key={'user' + user._id}>
                      <td className="name-cell">{`${tiebreaker.tied_flag ? 'T' : ''}${tiebreaker.place_in_week}. ${user.first_name} ${user.last_name}`}</td>
                      {user.picks.filter(pick => pick.game > 0 && pick.week === selectedWeek).map((pick, i) => {
                        const game = games[i];
                        let cells = [];
                        cells.push(
                          <td className={'text-xs-center visiting-team pick-points' + (game.winner_id ? (pick.pick_id === game.winner_id ? ' text-success' : ' text-danger') : '')} colSpan={3} key={'uservisitorpick' + pick._id}>
                            {pick.pick_id && pick.pick_id === game.visitor_id ? pick.points : null}
                          </td>
                        );
                        cells.push(
                          <td className={'text-xs-center home-team pick-points' + (game.winner_id ? (pick.pick_id === game.winner_id ? ' text-success' : ' text-danger') : '')} colSpan={3} key={'userhomepick' + pick._id}>
                            {pick.pick_id && pick.pick_id === game.home_id ? pick.points : null}
                          </td>
                        );
                        return cells;
                      })}
                      <td>{tiebreaker.points_earned}</td>
                      <td>{tiebreaker.games_correct}</td>
                      <td>{tiebreaker.last_score}</td>
                      <td>{tiebreaker.last_score_act}</td>
                    </tr>
                  );
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

ViewAllPicks.propTypes = {
  currentUser: PropTypes.object,
  currentWeek: PropTypes.number,
  games: PropTypes.arrayOf(PropTypes.object).isRequired,
  pageReady: PropTypes.bool.isRequired,
  selectedWeek: PropTypes.number,
  tiebreaker: PropTypes.object,
  users: PropTypes.arrayOf(PropTypes.object).isRequired
};

ViewAllPicks.contextTypes = {
  router: PropTypes.object.isRequired
}

export default createContainer(() => {
  const currentUser = User.findOne(Meteor.userId()),
      currentWeek = Session.get('currentWeek'),
      selectedWeek = Session.get('selectedWeek'),
      tiebreaker = currentUser.tiebreakers[selectedWeek - 1],
      gamesHandle = Meteor.subscribe('gamesForWeek', selectedWeek),
      gamesReady = gamesHandle.ready(),
      teamsHandle = Meteor.subscribe('allTeams'),
      teamsReady = teamsHandle.ready(),
      usersHandle = Meteor.subscribe('weekPlaces', selectedWeek),
      usersReady = usersHandle.ready();
  let games = [],
      users = [];
  if (gamesReady) {
    games = Game.find({ week: selectedWeek, game: { $ne: 0 }}, { sort: { game: 1 }}).fetch();
  }
  if (usersReady) {
    users = User.find({ done_registering: true }).fetch();
  }
  return {
    currentUser,
    currentWeek,
    games,
    pageReady: gamesReady && teamsReady && usersReady,
    selectedWeek,
    tiebreaker,
    users
  };
}, ViewAllPicks);
