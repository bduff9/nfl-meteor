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
      {gameReady ? [
        <div className="text-xs-center pull-xs-left picked-team" style={teamStyle} key={'pickedTeam' + game._id}>
          <img src={`/NFLLogos/${team.logo}`} />
        </div>,
        <div className="text-xs-center pull-xs-left over-text" key={'over' + game._id}>-over-</div>,
        <div className="text-xs-center pull-xs-left not-picked-team" key={'notPickedTeam' + game._id}>
          <img src={`/NFLLogos/${otherTeam.logo}`} />
        </div>
      ]
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
