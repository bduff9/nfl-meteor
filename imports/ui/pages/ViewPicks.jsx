/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { Loading } from './Loading.jsx';
import { Game, User } from '../../api/schema';
import { displayError } from '../../api/global';

class ViewPicks extends Component {
  constructor(prop) {
    super();
    this.state = {};
  }

  render() {
    const { games, gamesReady, picks, selectedWeek, teamsReady, tiebreaker } = this.props,
        pageReady = gamesReady && teamsReady,
        maxPoints = (games.length * (games.length + 1)) / 2,
        possiblePoints = picks.reduce((prevScore, pick) => {
          if ((pick.winner_id && pick.pick_id === pick.winner_id) || (!pick.winner_id && pick.pick_id)) return prevScore + pick.points;
          return prevScore;
        }, 0);
    return (
      <div className="view-picks-wrapper">
        <Helmet title={`View My Picks for Week ${selectedWeek}`} />
        <h3 className="title-text text-xs-center text-md-left offset-xs-2 hidden-md-up">{`View My Picks for Week ${selectedWeek}`}</h3>
        <button type="button" className="btn btn-primary hidden-sm-down print-page" onClick={window.print}>
          <i className="fa fa-fw fa-print" />
          Print this Page
        </button>
        {pageReady ? [
          <table className="table table-hover view-picks-table" key="view-picks-table">
            <thead className="thead-default">
              <tr>
                <th>Games</th>
                <th>My Pick</th>
                <th>Wager</th>
                <th>Winner</th>
              </tr>
            </thead>
            <tbody>
              {games.map((game, i) => {
                const homeTeam = game.getTeam('home'),
                    visitTeam = game.getTeam('visitor'),
                    thisPick = picks[i];
                return (
                  <tr key={'game' + i}>
                    <td>{`${visitTeam.city} ${visitTeam.name} @ ${homeTeam.city} ${homeTeam.name}`}</td>
                    <td className={game.winner_short ? (thisPick.pick_short === game.winner_short ? 'correct-pick' : 'incorrect-pick') : null}>{thisPick.pick_short}</td>
                    <td className={game.winner_short ? (thisPick.pick_short === game.winner_short ? 'correct-pick' : 'incorrect-pick') : null}>{thisPick.points}</td>
                    <td>
                      {game.winner_short}
                      {game.winner_short ? <i className={'fa fa-fw' + (thisPick.pick_short === game.winner_short ? ' fa-check text-success' : ' fa-times text-danger')} /> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>,
          <table className="table table-hover view-pick-results-table" key="view-pick-results-table">
            <thead className="thead-default">
              <tr>
                <th colSpan="2">My Results</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{`Week ${selectedWeek} score`}</td>
                <td>{tiebreaker.points_earned}/{maxPoints}</td>
              </tr>
              <tr>
                <td>Games picked correctly</td>
                <td>{tiebreaker.games_correct}/{games.length}</td>
              </tr>
              <tr>
                <td>Maximum possible score</td>
                <td>{possiblePoints}</td>
              </tr>
              <tr>
                <td>My tiebreaker score</td>
                <td>{tiebreaker.last_score}</td>
              </tr>
              <tr>
                <td>Final game's total</td>
                <td>{tiebreaker.last_score_act}</td>
              </tr>
            </tbody>
          </table>
          ]
          :
          <Loading />
        }
      </div>
    );
  }
}

ViewPicks.propTypes = {
  games: PropTypes.arrayOf(PropTypes.object).isRequired,
  gamesReady: PropTypes.bool.isRequired,
  picks: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedWeek: PropTypes.number,
  teamsReady: PropTypes.bool.isRequired,
  tiebreaker: PropTypes.object
};

export default createContainer(() => {
  const user = User.findOne(Meteor.userId()),
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
    games,
    gamesReady,
    picks,
    selectedWeek,
    teamsReady,
    tiebreaker
  };
}, ViewPicks);
