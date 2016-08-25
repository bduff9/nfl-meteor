/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import { Game } from '../../api/schema';
import { setSurvivorPick } from '../../api/collections/users';
import { displayError } from '../../api/global';

class SurvivorModal extends Component {
  constructor(props) {
    super();
    this.state = {};
  }

  componentDidMount(){
    $(this.refs.survivorModal).modal('show');
    $(this.refs.survivorModal).on('hidden.bs.modal', this.props._setModalWeek.bind(null, false));
  }

  _setSurvivorPick(week, gameId, team, ev) {
    setSurvivorPick.call({ gameId, teamId: team._id, teamShort: team.short_name, week }, displayError);
  }

  render() {
    const { games, gamesReady, pick, usedTeams, week } = this.props;
    return (
      <div className="modal fade survivor-modal" ref="survivorModal">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
              <h4 className="modal-title">{`Week ${week} Games`}</h4>
            </div>
            <div className="modal-body survivor-games">
              {games.map((game, i) => {
                const homeTeam = game.getTeam('home'),
                    visitingTeam = game.getTeam('visitor');
                return (
                  <div className="survivor-matchups pull-xs-left" key={'game' + i}>
                    <button type="button" className={'btn btn-' + (game.visitor_id === pick.pick_id ? 'success' : 'default')} title={game.visitor_short} onClick={this._setSurvivorPick.bind(null, week, game._id, visitingTeam)} disabled={usedTeams.indexOf(game.visitor_id) > -1} data-dismiss="modal">
                      <img src={`/NFLLogos/${visitingTeam.logo}`} />
                    </button>
                    <i className="fa fa-fw fa-large fa-at" />
                    <button type="button" className={'btn btn-' + (game.home_id === pick.pick_id ? 'success' : 'default')} title={game.home_short} onClick={this._setSurvivorPick.bind(null, week, game._id, homeTeam)} disabled={usedTeams.indexOf(game.home_id) > -1} data-dismiss="modal">
                      <img src={`/NFLLogos/${homeTeam.logo}`} />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

SurvivorModal.propTypes = {
  games: PropTypes.arrayOf(PropTypes.object).isRequired,
  gamesReady: PropTypes.bool.isRequired,
  pick: PropTypes.object.isRequired,
  usedTeams: PropTypes.arrayOf(PropTypes.string).isRequired,
  week: PropTypes.number.isRequired
};

export default createContainer(({ week }) => {
  const gamesHandle = Meteor.subscribe('gamesForWeek', week),
      gamesReady = gamesHandle.ready();
  let games = [];
  if (gamesReady) {
    games = Game.find({ week: week, game: { $ne : 0 }}, { sort: { game: 1 }}).fetch();
  }
  return {
    games,
    gamesReady,
    week
  };
}, SurvivorModal);
