import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import React, { FC } from 'react';

import { getGameByID, TGame } from '../../api/collections/games';
import { TSurvivorPick } from '../../api/collections/survivorpicks';
import { handleError } from '../../api/global';

export type TSurvivorPickProps = {
	game: TGame;
	gameReady: boolean;
	pick: TSurvivorPick;
};

const SurvivorPick: FC<TSurvivorPickProps> = ({
	game,
	gameReady,
	pick,
}): JSX.Element => {
	const team = pick.getTeam();
	const teamStyle = {
		backgroundColor: team.primary_color,
		borderColor: team.secondary_color,
	};
	let otherTeam;

	if (gameReady) {
		otherTeam = game.getTeam(
			pick.pick_id === game.home_id ? 'visitor' : 'home',
		);
	}

	return (
		<div className="survivor-pick">
			{gameReady && (
				<>
					<div className="text-center pull-left picked-team" style={teamStyle}>
						<img src={`/NFLLogos/${team.logo}`} />
					</div>
					<div className="text-center pull-left over-text">-over-</div>,
					<div className="text-center pull-left not-picked-team">
						{otherTeam && <img src={`/NFLLogos/${otherTeam.logo}`} />}
					</div>
				</>
			)}
		</div>
	);
};

SurvivorPick.whyDidYouRender = true;

export default withTracker<TSurvivorPickProps, { pick: TSurvivorPick }>(
	({ pick }): TSurvivorPickProps => {
		const gameHandle = Meteor.subscribe('getGame', pick.game_id);
		const gameReady = gameHandle.ready();
		let game: TGame = {} as any;

		if (gameReady)
			game = getGameByID.call({ gameId: pick.game_id }, handleError);

		return {
			game,
			gameReady,
			pick,
		};
	},
)(SurvivorPick);
