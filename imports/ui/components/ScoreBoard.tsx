import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { format } from 'date-fns';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import React, { FC, Fragment, useEffect } from 'react';

import { formatDate, handleError, pad } from '../../api/global';
import { getGamesForWeek, TGame } from '../../api/collections/games';
import { toggleScoreboard } from '../../api/collections/systemvals';
import { TWeek, TGameStatus } from '../../api/commonTypes';

import Loading from './Loading';

export type TScoreboardContainerProps = {
	changeScoreboardWeek: (w: TWeek) => void;
	week: TWeek;
};
export type TScoreBoardProps = TScoreboardContainerProps & {
	games: TGame[];
	weekGamesReady: boolean;
};

const ScoreBoard: FC<TScoreBoardProps> = ({
	games,
	week,
	weekGamesReady,
	changeScoreboardWeek,
}): JSX.Element => {
	let lastKickoff: string;

	useEffect((): (() => void) => {
		toggleScoreboard.call({ isOpen: true }, handleError);

		return (): void => toggleScoreboard.call({ isOpen: false }, handleError);
	}, []);

	const _getGameStatus = ({
		kickoff,
		status,
		// eslint-disable-next-line @typescript-eslint/camelcase
		time_left,
	}: {
		kickoff: Date;
		status: TGameStatus;
		time_left: number;
	}): string => {
		const SEC_IN_QTR = 900;
		let secLeftQtr;
		let minLeft;
		let secLeft;

		switch (status) {
			case 'P':
				return format(kickoff, 'h:mm a');
			case 'H':
				return 'Half';
			case 'C':
				return 'F';
			case '1':
			case '2':
			case '3':
			case '4':
				// eslint-disable-next-line @typescript-eslint/camelcase
				secLeftQtr = time_left % SEC_IN_QTR || SEC_IN_QTR;
				minLeft = Math.floor(secLeftQtr / 60);
				secLeft = secLeftQtr % 60;

				return `Q${status}, ${minLeft}:${pad(secLeft, 2, '0')}`;
			default:
				console.error('Invalid status flag', status);

				return 'ERROR';
		}
	};

	return (
		<div className="scoreboard">
			<h3 className="text-center">NFL Scoreboard</h3>
			<div className="inner-scoreboard">
				<div className="text-center week-disp">
					<span>
						{week > 1 && (
							<span
								onClick={(): void => changeScoreboardWeek((week - 1) as TWeek)}
							>
								<FontAwesomeIcon icon={['fad', 'caret-left']} fixedWidth />
							</span>
						)}
					</span>
					<span>
						{!weekGamesReady || games.length
							? `Week ${week}`
							: 'No games to display'}
					</span>
					<span>
						{week < 17 && (
							<span
								onClick={(): void => changeScoreboardWeek((week + 1) as TWeek)}
							>
								<FontAwesomeIcon icon={['fad', 'caret-right']} fixedWidth />
							</span>
						)}
					</span>
				</div>
				<div className="scores">
					{weekGamesReady ? (
						<table className="table table-condensed table-bordered">
							<tbody>
								{games.map(
									(game, i): JSX.Element => {
										const thisKickoff = formatDate(game.kickoff, false);

										return (
											<Fragment key={`scoreboard-game-${game._id}`}>
												{lastKickoff !== thisKickoff && (
													<tr
														className="text-center date-head"
														key={`kickoff-${game.kickoff}`}
													>
														<td colSpan={3}>
															<u>{(lastKickoff = thisKickoff)}</u>
														</td>
													</tr>
												)}
												<tr
													className={
														'away-score' +
														(game.in_redzone === 'V' ? ' bg-danger' : '')
													}
													key={'teamScore' + game.visitor_short}
												>
													<td colSpan={game.status === 'P' ? 3 : 1}>
														{game.visitor_short} &nbsp;
														{game.has_possession === 'V' && (
															<FontAwesomeIcon
																className="has-possession"
																icon={['fad', 'lemon']}
																size="lg"
															/>
														)}
													</td>
													{game.status !== 'P' && <td>{game.visitor_score}</td>}
													{game.status !== 'P' && <td />}
												</tr>
												<tr
													className={
														'home-score' +
														(game.in_redzone === 'H' ? ' bg-danger' : '')
													}
													key={'teamScore' + game.home_short}
												>
													<td>
														{game.home_short} &nbsp;
														{game.has_possession === 'H' && (
															<FontAwesomeIcon
																className="has-possession"
																icon={['fad', 'lemon']}
																size="lg"
															/>
														)}
													</td>
													{game.status !== 'P' && <td>{game.home_score}</td>}
													<td colSpan={game.status === 'P' ? 2 : 1}>
														{_getGameStatus(game)}
													</td>
												</tr>
												{i < games.length - 1 && (
													<tr className="divider" key={`divider-${game._id}`}>
														<td colSpan={3} />
													</tr>
												)}
											</Fragment>
										);
									},
								)}
							</tbody>
						</table>
					) : (
						<Loading />
					)}
				</div>
			</div>
		</div>
	);
};

ScoreBoard.whyDidYouRender = true;

export default withTracker<TScoreBoardProps, TScoreboardContainerProps>(
	({ week, changeScoreboardWeek }): TScoreBoardProps => {
		const weekGameHandle = Meteor.subscribe('gamesForWeek', week);
		const weekGamesReady = weekGameHandle.ready();
		let games = [];

		if (weekGamesReady) games = getGamesForWeek.call({ week }, handleError);

		return {
			games,
			week,
			weekGamesReady,
			changeScoreboardWeek,
		};
	},
)(ScoreBoard);
