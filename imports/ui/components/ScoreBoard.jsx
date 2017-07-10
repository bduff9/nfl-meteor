'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import { moment } from 'meteor/momentjs:moment';

import { displayError, pad } from '../../api/global';
import { getGamesForWeek } from '../../api/collections/games';
import { toggleScoreboard } from '../../api/collections/systemvals';

class ScoreBoard extends Component {
	constructor(props) {
		super();
		this.state = {};
	}

	componentWillMount() {
		const IS_OPEN = true;
		toggleScoreboard.call({ isOpen: IS_OPEN }, displayError);
	}
	componentWillUnmount() {
		const IS_OPEN = false;
		toggleScoreboard.call({ isOpen: IS_OPEN }, displayError);
	}

	_getGameStatus({ kickoff, status, time_left }) {
		const SEC_IN_QTR = 900;
		let secLeftQtr, minLeft, secLeft;
		switch(status) {
			case 'P':
				return moment(kickoff).format('h:mm a');
			case 'H':
				return 'Half';
			case 'C':
				return 'F';
			case '1':
			case '2':
			case '3':
			case '4':
				secLeftQtr = time_left % SEC_IN_QTR || SEC_IN_QTR;
				minLeft = Math.floor(secLeftQtr / 60);
				secLeft = secLeftQtr % 60;
				return `Q${status}, ${minLeft}:${pad(secLeft, '0', 2)}`;
			default:
				console.error('Invalid status flag', status);
				return 'ERROR';
		}
	}

	render() {
		const { games, week, weekGamesReady, _changeScoreboardWeek } = this.props;
		let lastKickoff;
		return (
			<div className="scoreboard">
				<h3 className="text-xs-center">NFL Scoreboard</h3>
				<div className="inner-scoreboard">
					<div className="text-xs-center week-disp">
						<span>{week > 1 ? <i className="fa fa-fw fa-caret-left" onClick={_changeScoreboardWeek.bind(null, week - 1)} /> : null}</span>
						<span>{!weekGamesReady || games.length ? `Week ${week}` : 'No games to display'}</span>
						<span>{week < 17 ? <i className="fa fa-fw fa-caret-right" onClick={_changeScoreboardWeek.bind(null, week + 1)} /> : null}</span>
					</div>
					<div className="scores">
						{weekGamesReady ? (
							<table className="table table-condensed table-bordered">
								<tbody>
									{games.map((game, i) => {
										let rows = [],
												thisKickoff = moment(game.kickoff).format('ddd, MMM D');
										if (lastKickoff !== thisKickoff) {
											rows.push(
												<tr className="text-xs-center date-head" key={'kickoff' + game.kickoff}>
													<td colSpan="3">
														<u>{thisKickoff}</u>
													</td>
												</tr>
											);
											lastKickoff = thisKickoff;
										}
										rows.push(
											<tr className={'away-score' + (game.in_redzone === 'V' ? ' bg-danger' : '')} key={'teamScore' + game.visitor_short}>
												<td colSpan={game.status === 'P' ? 3 : 1}>
													{game.visitor_short} &nbsp;
													{game.has_possession === 'V' ? <i className="fa fa-large fa-lemon-o has-possession" /> : null}
												</td>
												{game.status !== 'P' ? <td>{game.visitor_score}</td> : null}
												{game.status !== 'P' ? <td></td> : null}
											</tr>
										);
										rows.push(
											<tr className={'home-score' + (game.in_redzone === 'H' ? ' bg-danger' : '')} key={'teamScore' + game.home_short}>
												<td>
													{game.home_short} &nbsp;
													{game.has_possession === 'H' ? <i className="fa fa-large fa-lemon-o has-possession" /> : null}
												</td>
												{game.status !== 'P' ? <td>{game.home_score}</td> : null}
												<td colSpan={game.status === 'P' ? 2 : 1}>{this._getGameStatus(game)}</td>
											</tr>
										);
										if (i < (games.length - 1)) {
											rows.push(
												<tr className="divider" key={'divider' + game._id}>
													<td colSpan="3"></td>
												</tr>
											);
										}
										return rows;
									})}
								</tbody>
							</table>
						)
							:
							(
								<div className="text-xs-center loading">Loading...
									<br />
									<i className="fa fa-spinner fa-pulse" />
								</div>
							)}
					</div>
				</div>
			</div>
		);
	}
}

ScoreBoard.propTypes = {
	games: PropTypes.arrayOf(PropTypes.object).isRequired,
	week: PropTypes.number.isRequired,
	weekGamesReady: PropTypes.bool.isRequired,
	_changeScoreboardWeek: PropTypes.func.isRequired
};

export default createContainer(({ week, _changeScoreboardWeek }) => {
	const weekGameHandle = Meteor.subscribe('gamesForWeek', week),
			weekGamesReady = weekGameHandle.ready();
	let games = [];
	if (weekGamesReady) games = getGamesForWeek.call({ week }, displayError);
	return {
		games,
		week,
		weekGamesReady,
		_changeScoreboardWeek
	};
}, ScoreBoard);
