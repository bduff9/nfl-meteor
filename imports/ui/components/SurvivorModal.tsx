import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import $ from 'jquery';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import React, { FC, useEffect, useRef } from 'react';
import sweetAlert from 'sweetalert';

import { getGamesForWeek, TGame } from '../../api/collections/games';
import {
	setSurvivorPick,
	TSurvivorPick,
} from '../../api/collections/survivorpicks';
import { TTeam } from '../../api/collections/teams';
import { TError, TWeek } from '../../api/commonTypes';
import { DEFAULT_LEAGUE } from '../../api/constants';
import { handleError } from '../../api/global';

export type TSurvivorModalOuterProps = {
	pick: TSurvivorPick;
	setModalWeek: (w: TWeek | false) => void;
	usedTeams: string[];
	week: TWeek;
};
export type TSurvivorModalProps = {
	currentLeague: string;
	games: TGame[];
	pageReady: boolean;
	pick: TSurvivorPick;
	setModalWeek: (w: TWeek | false) => void;
	usedTeams: string[];
	week: TWeek;
};

const SurvivorModal: FC<TSurvivorModalProps> = ({
	currentLeague,
	games,
	pick,
	setModalWeek,
	usedTeams,
	week,
}): JSX.Element => {
	const survivorModalRef = useRef<HTMLDivElement>(null);

	useEffect((): (() => void) => {
		const modal = survivorModalRef.current;

		if (modal) {
			$(modal).modal('show');
			$(modal).on('hidden.bs.modal', (): void => setModalWeek(false));
		}

		return (): void => {
			if (modal) $(modal).modal('dispose');
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [week]);

	const _setSurvivorPick = (gameId: string, team: TTeam): void => {
		setSurvivorPick.call(
			{
				gameId,
				league: currentLeague,
				teamId: team._id,
				teamShort: team.short_name,
				week,
			},
			(err: TError): void | Promise<boolean> => {
				if (err) return handleError(err);

				sweetAlert({
					title: 'Way to go!',
					text: `Your week ${week} pick has been successfully saved!`,
					icon: 'success',
				}).then((): void => setModalWeek(false));
			},
		);
	};

	return (
		<div className="modal fade survivor-modal" ref={survivorModalRef}>
			<div className="modal-dialog">
				<div className="modal-content">
					<div className="modal-header">
						<h4 className="modal-title">{`Week ${week} Games`}</h4>
						<button
							type="button"
							className="close"
							data-dismiss="modal"
							aria-label="Close"
						>
							<FontAwesomeIcon
								className="text-danger"
								icon={['fad', 'times']}
								fixedWidth
							/>
						</button>
					</div>
					<div className="modal-body survivor-games">
						{games.map(
							(game, i): JSX.Element => {
								const homeTeam = game.getTeam('home');
								const visitingTeam = game.getTeam('visitor');

								return (
									<div
										className="survivor-matchups pull-xs-left"
										key={'game' + i}
									>
										<button
											type="button"
											className={
												'btn btn-' +
												(game.visitor_id === pick.pick_id
													? 'success'
													: 'secondary')
											}
											title={`${visitingTeam.city} ${visitingTeam.name}`}
											onClick={(): void =>
												_setSurvivorPick(game._id, visitingTeam)
											}
											disabled={usedTeams.indexOf(game.visitor_id) > -1}
											data-dismiss="modal"
										>
											<img src={`/NFLLogos/${visitingTeam.logo}`} />
										</button>
										<FontAwesomeIcon
											icon={['fad', 'at']}
											fixedWidth
											size="lg"
										/>
										<button
											type="button"
											className={
												'btn btn-' +
												(game.home_id === pick.pick_id
													? 'success'
													: 'secondary')
											}
											title={`${homeTeam.city} ${homeTeam.name}`}
											onClick={(): void => _setSurvivorPick(game._id, homeTeam)}
											disabled={usedTeams.indexOf(game.home_id) > -1}
											data-dismiss="modal"
										>
											<img src={`/NFLLogos/${homeTeam.logo}`} />
										</button>
									</div>
								);
							},
						)}
					</div>
					<div className="modal-footer">
						<button
							type="button"
							className="btn btn-secondary"
							data-dismiss="modal"
						>
							Close
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

SurvivorModal.whyDidYouRender = true;

export default withTracker<TSurvivorModalProps, TSurvivorModalOuterProps>(
	({ week, ...rest }): TSurvivorModalProps => {
		const gamesHandle = Meteor.subscribe('gamesForWeek', week);
		const gamesReady = gamesHandle.ready();
		const currentLeague = DEFAULT_LEAGUE; //Session.get('selectedLeague'); //TODO: Eventually will need to uncomment this and allow them to change current league
		let games: TGame[] = [];

		if (gamesReady) games = getGamesForWeek.call({ week }, handleError);

		return {
			...rest,
			currentLeague,
			games,
			pageReady: gamesReady,
			week,
		};
	},
)(SurvivorModal);
