'use strict';

import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Session } from 'meteor/session';
import { createContainer } from 'meteor/react-meteor-data';
import Helmet from 'react-helmet';

import { DEFAULT_LEAGUE } from '../../api/constants';
import { handleError } from '../../api/global';
import { Loading } from './Loading.jsx';
import SurvivorPick from '../components/SurvivorPick.jsx';
import SurvivorModal from '../components/SurvivorModal.jsx';
import { getNextGame } from '../../api/collections/games';
import { getAllNFLTeams } from '../../api/collections/teams.js';
import { getMySurvivorPicks } from '../../api/collections/survivorpicks';

class SetSurvivor extends Component {
	constructor (props) {
		super();
		this.state = {
			modalWeek: false
		};
		this._setModalWeek = this._setModalWeek.bind(this);
	}

	componentWillMount () {
		const { survivorPicks = [] } = this.props,
				notAllowed = survivorPicks.length > 0 && survivorPicks.length < 17;
		if (notAllowed) this.context.router.push('/survivor/view');
	}

	_setModalWeek (week, ev) {
		this.setState({ modalWeek: week || false });
	}

	render () {
		const { modalWeek } = this.state,
				{ currentWeek, nextGame, pageReady, survivorPicks, teams } = this.props,
				weekForSec = nextGame.week - (nextGame.game === 1 ? 1 : 0);
		return (
			<div className="row set-survivor-wrapper">
				<Helmet title={'Make Survivor Picks'} />
				{pageReady ? (
					<div className="col-xs-12">
						<h3 className="title-text text-xs-center text-md-left hidden-md-up">Make Survivor Picks</h3>
						<div className="row">
							<div className="col-md-4 hidden-sm-down side-bar">
								{teams.map((team, i) => {
									const weekIndex = survivorPicks.findIndex((pick, i) => team._id === pick.pick_id);
									return (
										<div className="col-md-3 col-xs-2" key={'team' + i}>
											<div className="text-xs-center survivor-logo">
												<img src={`/NFLLogos/${team.logo}`} className={(weekIndex !== -1 ? 'used' : '')} />
												{weekIndex !== -1 ? <span className="tag tag-default when-picked">{weekIndex + 1}</span> : null}
											</div>
										</div>
									);
								})}
							</div>
							<div className="col-md-7 offset-md-5 col-xs-12">
								<table className="table table-hover set-survivor-table">
									<thead className="thead-default">
										<tr>
											<th className="text-xs-center">Week</th>
											<th className="text-xs-center">Pick</th>
										</tr>
									</thead>
									<tbody>
										{survivorPicks.map((pick, i) => (
											<tr key={'survivor' + i}>
												<td className="text-xs-right">
													{pick.winner_id ? (pick.pick_id === pick.winner_id ? <i className="fa fa-fw fa-lg fa-check text-success" /> : <i className="fa fa-fw fa-lg fa-times text-danger" />) : null}
													{pick.week}
												</td>
												<td className="text-xs-left">
													{pick.week > weekForSec ? (
														<button type="button" className={'btn btn-' + (pick.pick_id ? 'success is-picked' : (pick.week === currentWeek ? 'danger' : 'primary'))} onClick={this._setModalWeek.bind(null, pick.week)}>
															<i className="fa fa-fw fa-large fa-pencil-square-o" />
															&nbsp; Pick Team
														</button>
													)
														:
														null
													}
													{pick.pick_id ? <SurvivorPick pick={pick} /> : null}
												</td>
											</tr>
										))}
									</tbody>
								</table>
								{modalWeek ? (
									<SurvivorModal
										pick={survivorPicks[modalWeek - 1]}
										usedTeams={survivorPicks.filter(pick => pick.pick_id).map(pick => pick.pick_id)}
										week={modalWeek}
										_setModalWeek={this._setModalWeek} />
								)
									:
									null
								}
							</div>
						</div>
					</div>
				)
					:
					<Loading />
				}
			</div>
		);
	}
}

SetSurvivor.propTypes = {
	currentWeek: PropTypes.number,
	nextGame: PropTypes.object,
	pageReady: PropTypes.bool.isRequired,
	survivorPicks: PropTypes.arrayOf(PropTypes.object).isRequired,
	teams: PropTypes.arrayOf(PropTypes.object).isRequired
};

SetSurvivor.contextTypes = {
	router: PropTypes.object.isRequired
};

export default createContainer(() => {
	const currentWeek = Session.get('currentWeek'),
			currentLeague = DEFAULT_LEAGUE, //Session.get('selectedLeague'), //TODO: Eventually will need to uncomment this and allow them to change current league
			nextGameHandle = Meteor.subscribe('nextGameToStart'),
			nextGameReady = nextGameHandle.ready(),
			survivorHandle = Meteor.subscribe('mySurvivorPicks', currentLeague),
			survivorReady = survivorHandle.ready(),
			teamsHandle = Meteor.subscribe('nflTeams'),
			teamsReady = teamsHandle.ready();
	let nextGame = {},
			survivorPicks = [],
			teams = [];
	if (nextGameReady) nextGame = getNextGame.call({}, handleError);
	if (survivorReady) survivorPicks = getMySurvivorPicks.call({ league: currentLeague }, handleError);
	if (teamsReady) teams = getAllNFLTeams.call({}, handleError);
	return {
		currentWeek,
		nextGame,
		pageReady: nextGameReady && survivorReady && teamsReady,
		survivorPicks,
		teams
	};
}, SetSurvivor);
