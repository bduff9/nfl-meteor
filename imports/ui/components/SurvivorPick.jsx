'use strict';

import { Meteor } from 'meteor/meteor';
import React from 'react';
import PropTypes from 'prop-types';
import { createContainer } from 'meteor/react-meteor-data';

import { handleError } from '../../api/global';
import { getGameByID } from '../../api/collections/games';

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
				<div className="text-center pull-xs-left picked-team" style={teamStyle} key={'pickedTeam' + game._id}>
					<img src={`/NFLLogos/${team.logo}`} />
				</div>,
				<div className="text-center pull-xs-left over-text" key={'over' + game._id}>-over-</div>,
				<div className="text-center pull-xs-left not-picked-team" key={'notPickedTeam' + game._id}>
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
	if (gameReady) game = getGameByID.call({ gameId: pick.game_id }, handleError);
	return {
		game,
		gameReady,
		pick
	};
}, SurvivorPick);
