/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';
import { createContainer } from 'meteor/react-meteor-data';

import { Game } from '../../api/schema';

const SurvivorPick = ({ game, gameReady, pick }) => {
  const team = pick.getTeam(),
      teamStyle = { backgroundColor: team.primary_color, borderColor: team.secondary_color };
  let otherTeam;
  if (gameReady) {
    otherTeam = game.getTeam((pick.pick_id === game.home_id ? 'visitor' : 'home'));
  }
  return (
    <div className="survivor-pick">
      {gameReady ? (
        <div>
          <div className="picked-team text-xs-center" style={teamStyle}>
            <img src={`/NFLLogos/${team.logo}`} />
          </div>
          <div className="text-xs-center">-over-</div>
          <div className="not-picked-team text-xs-center">
            <img src={`/NFLLogos/${otherTeam.logo}`} />
          </div>
        </div>
      )
      :
        null
      }
    </div>
  );
};

SurvivorPick.propTypes = {
  game: PropTypes.object.isRequired,
  gameReady: PropTypes.bool.isRequired,
  pick: PropTypes.object.isRequired
};

export default createContainer(({ pick }) => {
  const gameHandle = Meteor.subscribe('getGame', pick.game_id),
      gameReady = gameHandle.ready();
  let game = {};
  if (gameReady) {
    game = Game.findOne(pick.game_id);
  }
  return {
    game,
    gameReady,
    pick
  };
}, SurvivorPick);
