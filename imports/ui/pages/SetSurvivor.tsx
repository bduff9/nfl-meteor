import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import React, { FC, useState, useEffect } from 'react';
import Helmet from 'react-helmet';
import { RouteComponentProps, withRouter } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { getNextGame, TGame } from '../../api/collections/games';
import {
	getMySurvivorPicks,
	TSurvivorPick,
} from '../../api/collections/survivorpicks';
import { getAllNFLTeams, TTeam } from '../../api/collections/teams';
import { TWeek } from '../../api/commonTypes';
import { DEFAULT_LEAGUE } from '../../api/constants';
import { handleError } from '../../api/global';
import SurvivorModal from '../components/SurvivorModal';
import SurvivorPick from '../components/SurvivorPick';

import Loading from './Loading';

export type TSetSurvivorProps = {
	currentWeek: TWeek;
	nextGame: TGame;
	pageReady: boolean;
	survivorPicks: TSurvivorPick[];
	teams: TTeam[];
};

const SetSurvivor: FC<RouteComponentProps & TSetSurvivorProps> = ({
	currentWeek,
	history,
	nextGame,
	pageReady,
	survivorPicks,
	teams,
}): JSX.Element => {
	const [modalWeek, setModalWeek] = useState<TWeek | false>(false);
	const weekForSec = nextGame.week - (nextGame.game === 1 ? 1 : 0);

	useEffect((): void => {
		const notAllowed = survivorPicks.length > 0 && survivorPicks.length < 17;

		if (notAllowed) history.push('/survivor/view');
	}, [history, survivorPicks]);

	const _setModalWeek = (week: TWeek | false = false): void => {
		setModalWeek(week);
	};

	return (
		<div className="row set-survivor-wrapper">
			<Helmet title={'Make Survivor Picks'} />
			{pageReady ? (
				<div className="col-12">
					<h3 className="title-text text-center text-md-left d-md-none">
						Make Survivor Picks
					</h3>
					<div className="row">
						<div className="col-md-6 d-none d-md-flex side-bar">
							{teams.map(
								(team): JSX.Element => {
									const weekIndex = survivorPicks.findIndex(
										(pick): boolean => team._id === pick.pick_id,
									);

									return (
										<div
											className="text-center survivor-logo"
											key={`team-${team._id}`}
										>
											<img
												src={`/NFLLogos/${team.logo}`}
												className={weekIndex !== -1 ? 'used' : undefined}
											/>
											{weekIndex !== -1 && (
												<span className="tag tag-default when-picked">
													{weekIndex + 1}
												</span>
											)}
										</div>
									);
								},
							)}
						</div>
						<div className="col-md-5 offset-md-7 col-12">
							<table className="table table-hover set-survivor-table">
								<thead className="thead-default">
									<tr>
										<th className="text-center">Week</th>
										<th className="text-center">Pick</th>
									</tr>
								</thead>
								<tbody>
									{survivorPicks.map(
										(pick): JSX.Element => (
											<tr key={`survivor-${pick._id}`}>
												<td className="text-center">
													{pick.winner_id &&
														(pick.pick_id === pick.winner_id ? (
															<FontAwesomeIcon
																className="text-success"
																icon={['fad', 'check']}
																fixedWidth
																size="lg"
															/>
														) : (
															<FontAwesomeIcon
																className="text-danger"
																icon={['fad', 'times']}
																fixedWidth
																size="lg"
															/>
														))}
													{pick.week}
												</td>
												<td className="text-left">
													{pick.week > weekForSec && (
														<button
															type="button"
															className={
																'btn btn-' +
																(pick.pick_id
																	? 'success is-picked'
																	: pick.week === currentWeek
																		? 'danger'
																		: 'primary')
															}
															onClick={(): void => _setModalWeek(pick.week)}
														>
															<FontAwesomeIcon
																icon={['fad', 'edit']}
																fixedWidth
																size="lg"
															/>
															&nbsp; Pick Team
														</button>
													)}
													{pick.pick_id && <SurvivorPick pick={pick} />}
												</td>
											</tr>
										),
									)}
								</tbody>
							</table>
							{modalWeek && (
								<SurvivorModal
									pick={survivorPicks[modalWeek - 1]}
									setModalWeek={_setModalWeek}
									usedTeams={survivorPicks
										.filter((pick): boolean => !!pick.pick_id)
										.map((pick): string => pick.pick_id || '')}
									week={modalWeek}
								/>
							)}
						</div>
					</div>
				</div>
			) : (
				<Loading />
			)}
		</div>
	);
};

SetSurvivor.whyDidYouRender = true;

export default withTracker<TSetSurvivorProps, {}>(
	(): TSetSurvivorProps => {
		const currentWeek = Session.get('currentWeek');
		const currentLeague = DEFAULT_LEAGUE; //Session.get('selectedLeague'), //TODO: Eventually will need to uncomment this and allow them to change current league
		const nextGameHandle = Meteor.subscribe('nextGameToStart');
		const nextGameReady = nextGameHandle.ready();
		const survivorHandle = Meteor.subscribe('mySurvivorPicks', currentLeague);
		const survivorReady = survivorHandle.ready();
		const teamsHandle = Meteor.subscribe('nflTeams');
		const teamsReady = teamsHandle.ready();
		let nextGame: TGame = {} as any;
		let survivorPicks: TSurvivorPick[] = [];
		let teams: TTeam[] = [];

		if (nextGameReady) nextGame = getNextGame.call({}, handleError);

		if (survivorReady)
			survivorPicks = getMySurvivorPicks.call(
				{ league: currentLeague },
				handleError,
			);

		if (teamsReady) teams = getAllNFLTeams.call({}, handleError);

		return {
			currentWeek,
			nextGame,
			pageReady: nextGameReady && survivorReady && teamsReady,
			survivorPicks,
			teams,
		};
	},
)(withRouter(SetSurvivor));
