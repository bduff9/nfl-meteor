import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import React, { FC, useEffect, useRef } from 'react';
import Tether from 'tether';

import { getTeamByID, TTeam } from '../../api/collections/teams';
import { handleError } from '../../api/global';
import { TGame } from '../../api/collections/games';

export type TTeamHoverOuterProps = {
	game: TGame;
	isHome: boolean;
	target: HTMLElement | null;
	teamId: string;
};
export type TTeamHoverProps = {
	currentGame: TGame;
	isHome: boolean;
	pageReady: boolean;
	target: HTMLElement | null;
	teamInfo: TTeam;
};

const TeamHover: FC<TTeamHoverProps> = ({
	currentGame,
	isHome,
	pageReady,
	target,
	teamInfo,
}): JSX.Element => {
	const hoverWindowRef = useRef<HTMLTableElement>(null);
	const tether = useRef<Tether | null>(null);
	let won;
	let lost;
	let tied;

	useEffect((): (() => void) => {
		const element = hoverWindowRef.current;

		tether.current = new Tether({
			element,
			target,
			attachment: 'middle right',
			constraints: [
				{
					to: 'window',
					attachment: 'together',
					pin: true,
				},
			],
		});

		return (): void => {
			if (tether.current) tether.current.destroy();

			if (element) document.body.removeChild(element);
		};
	}, [target]);

	if (pageReady) {
		won = teamInfo.history.reduce((prev, game) => {
			if (game.did_win) return prev + 1;

			return prev;
		}, 0);
		lost = teamInfo.history.reduce((prev, game) => {
			if (!game.did_win && !game.did_tie) return prev + 1;

			return prev;
		}, 0);
		tied = teamInfo.history.reduce((prev, game) => {
			if (game.did_tie) return prev + 1;

			return prev;
		}, 0);
	}

	return (
		<div className="team-hover-wrapper">
			<table
				className={`team-hover${!pageReady ? ' team-loading' : ''}`}
				style={{
					color: teamInfo.secondary_color,
					backgroundColor: teamInfo.primary_color,
					borderColor: teamInfo.secondary_color,
				}}
				ref={hoverWindowRef}
			>
				{pageReady ? (
					[
						<thead key={`theadFor${teamInfo._id}`}>
							<tr>
								<th>{`${teamInfo.city} ${teamInfo.name}`}</th>
							</tr>
						</thead>,
						<tbody key={`tbodyFor${teamInfo._id}`}>
							<tr>
								<td>{`${teamInfo.conference} ${teamInfo.division}`}</td>
							</tr>
							<tr>
								<td>{`Rushing Offense: ${teamInfo.rush_offense ||
									''} | Passing Offense: ${teamInfo.pass_offense || ''}`}</td>
							</tr>
							<tr>
								<td>{`Rushing Defense: ${teamInfo.rush_defense ||
									''} | Passing Defense: ${teamInfo.pass_defense || ''}`}</td>
							</tr>
							<tr className="d-none">
								<td>{`Conference Rank: ${teamInfo.rank || ''}`}</td>
							</tr>
							<tr>
								<td>
									<div
										className={
											teamInfo.history.length > 0 ? 'history-separator' : ''
										}
										style={{
											borderBottomColor: teamInfo.secondary_color,
										}}
									>{`Record: ${won}-${lost}-${tied}`}</div>
								</td>
							</tr>
							{teamInfo.history.map((game, i) => (
								<tr key={'history' + game.game_id}>
									<td>
										{`Week ${game.week || i + 1}: ${
											game.was_home ? 'vs. ' : '@ '
										}`}
										{game.getOpponent().name}&nbsp;
										<span
											className={
												game.did_win
													? 'did-win'
													: game.did_tie
														? 'did-tie'
														: 'did-lose'
											}
										>
											{game.did_win ? 'W' : game.did_tie ? 'T' : 'L'}
										</span>
										{` (${game.final_score})`}
									</td>
								</tr>
							))}
							{teamInfo.history.filter(game => game.week === currentGame.week)
								.length === 0 && (
								<tr>
									<td>
										<strong>
											{`Week ${currentGame.week}: ${isHome ? 'vs. ' : '@ '}`}
											{currentGame.getTeam(isHome ? 'visitor' : 'home').name}
											{isHome && currentGame.home_spread != null
												? ` (${currentGame.home_spread})`
												: null}
											{!isHome && currentGame.visitor_spread != null
												? ` (${currentGame.visitor_spread})`
												: null}
										</strong>
									</td>
								</tr>
							)}
						</tbody>,
					]
				) : (
					<tbody>
						<tr>
							<td>Loading...</td>
						</tr>
					</tbody>
				)}
			</table>
		</div>
	);
};

TeamHover.whyDidYouRender = true;

export default withTracker<TTeamHoverProps, TTeamHoverOuterProps>(
	({ game, isHome, target, teamId }): TTeamHoverProps => {
		const teamHandle = Meteor.subscribe('getTeamInfo', teamId);
		const teamReady = teamHandle.ready();
		let teamInfo: TTeam = {} as any;

		if (teamReady) teamInfo = getTeamByID.call({ teamId }, handleError);

		return {
			currentGame: game,
			isHome,
			pageReady: teamReady,
			target,
			teamInfo,
		};
	},
)(TeamHover);
