/* globals Tether */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import { displayError } from '../../api/global';
import { getTeamByID } from '../../api/collections/teams';

class TeamHover extends Component {
	constructor(props) {
		super();
		this.state = {};
	}

	componentDidMount() {
		const { target } = this.props,
				element = this.hoverWindowRef;
		this._tether = new Tether({
			element,
			target,
			attachment: 'middle right',
			constraints: [
				{
					to: 'window',
					attachment: 'together',
					pin: true
				}
			]
		});
	}
	componentWillUnmount() {
		const element = this.hoverWindowRef;
		this._tether.destroy();
		document.body.removeChild(element);
	}

	render() {
		const { currentGame, isHome, pageReady, teamInfo } = this.props;
		let won, lost, tied;
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
				<table className={`team-hover${!pageReady ? ' team-loading' : ''}`} style={{ color: teamInfo.secondary_color, backgroundColor: teamInfo.primary_color, borderColor: teamInfo.secondary_color }} ref={table => { this.hoverWindowRef = table; }}>
					{pageReady ? [
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
								<td>{`Rushing Offense: ${teamInfo.rush_offense || ''} | Passing Offense: ${teamInfo.pass_offense || ''}`}</td>
							</tr>
							<tr>
								<td>{`Rushing Defense: ${teamInfo.rush_defense || ''} | Passing Defense: ${teamInfo.pass_defense || ''}`}</td>
							</tr>
							<tr className="hidden-xs-up">
								<td>{`Conference Rank: ${teamInfo.rank || ''}`}</td>
							</tr>
							<tr>
								<td>
									<div className={teamInfo.history.length > 0 ? 'history-separator' : ''} style={{ borderBottomColor: teamInfo.secondary_color }}>{`Record: ${won}-${lost}-${tied}`}</div>
								</td>
							</tr>
							{teamInfo.history.map((game, i) => (
								<tr key={'history' + game.game_id}>
									<td>
										{`Week ${game.week || (i + 1)}: ${game.was_home ? 'vs. ' : '@ '}`}
										{game.getOpponent().name}&nbsp;
										<span className={game.did_win ? 'did-win' : (game.did_tie ? 'did-tie' : 'did-lose')}>
											{game.did_win ? 'W' : (game.did_tie ? 'T' : 'L')}
										</span>
										{` (${game.final_score})`}
									</td>
								</tr>
							))}
							{teamInfo.history.filter(game => game.week === currentGame.week).length === 0 ? (
								<tr>
									<td>
										<strong>
											{`Week ${currentGame.week}: ${isHome ? 'vs. ' : '@ '}`}
											{`${currentGame.getTeam(isHome ? 'visitor' : 'home').name}`}
											{`${isHome ? (currentGame.home_spread != null ? ` (${currentGame.home_spread})` : '') : (currentGame.visitor_spread != null ? ` (${currentGame.visitor_spread})` : '')}`}
										</strong>
									</td>
								</tr>
							)
								:
								null
							}
						</tbody>
					]
						:
						(
							<tbody>
								<tr>
									<td>Loading...</td>
								</tr>
							</tbody>
						)}
				</table>
			</div>
		);
	}
}

TeamHover.propTypes = {
	currentGame: PropTypes.object.isRequired,
	isHome: PropTypes.bool.isRequired,
	pageReady: PropTypes.bool.isRequired,
	target: PropTypes.any.isRequired,
	teamInfo: PropTypes.object.isRequired
};

TeamHover._tether = null;

export default createContainer(({ game, isHome, teamId }) => {
	const teamHandle = Meteor.subscribe('getTeamInfo', teamId),
			teamReady = teamHandle.ready();
	let teamInfo = {};
	if (teamReady) teamInfo = getTeamByID.call({ teamId }, displayError);
	return {
		currentGame: game,
		isHome,
		pageReady: teamReady,
		teamInfo
	};
}, TeamHover);
