import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import React, { FC, useState, useEffect } from 'react';
import Helmet from 'react-helmet';
import { withRouter, RouteComponentProps } from 'react-router';

import { getNextGame, TGame } from '../../api/collections/games';
import { TWeek } from '../../api/commonTypes';
import { handleError } from '../../api/global';
import OverallSurvivor from '../components/OverallSurvivor';
import WeekSurvivor from '../components/WeekSurvivor';

import Loading from './Loading';

export type TViewSurvivorProps = {
	nextGame: TGame;
	pageReady: boolean;
	selectedWeek: TWeek;
};

const ViewSurvivor: FC<RouteComponentProps & TViewSurvivorProps> = ({
	history,
	nextGame,
	pageReady,
	selectedWeek,
}): JSX.Element => {
	const [viewOverall, setViewOverall] = useState<boolean>(true);
	const weekForSec = nextGame.week - (nextGame.game === 1 ? 1 : 0);

	useEffect((): void => {
		const notAllowed = pageReady && nextGame.week === 1 && nextGame.game === 1;

		if (notAllowed) history.push('/');

		if (
			nextGame.week > selectedWeek ||
			(nextGame.week === selectedWeek && nextGame.game > 1)
		)
			setViewOverall(true);
	}, [history, nextGame.game, nextGame.week, pageReady, selectedWeek]);

	const _toggleOverall = (): void => {
		setViewOverall(!viewOverall);
	};

	return (
		<div className="row view-survivor-wrapper">
			<Helmet title={'View Survivor Picks'} />
			<h3 className="col-12 title-text text-center text-md-left d-md-none">
				View Survivor Picks
			</h3>
			{pageReady ? (
				<div className="col-12 view-survivor-picks">
					View:
					<select
						className="form-control"
						value={`${viewOverall}`}
						onChange={_toggleOverall}
					>
						<option value="true">Overall</option>
						{nextGame.week > selectedWeek ||
							(nextGame.week === selectedWeek && nextGame.game > 1 && (
								<option value="false">{`Week ${selectedWeek}`}</option>
							))}
					</select>
					{viewOverall ? (
						<OverallSurvivor weekForSec={weekForSec} />
					) : (
						<WeekSurvivor week={selectedWeek} weekForSec={weekForSec} />
					)}
				</div>
			) : (
				<Loading />
			)}
		</div>
	);
};

ViewSurvivor.whyDidYouRender = true;

export default withTracker<TViewSurvivorProps, {}>(
	(): TViewSurvivorProps => {
		const nextGameHandle = Meteor.subscribe('nextGameToStart');
		const nextGameReady = nextGameHandle.ready();
		const selectedWeek = Session.get('selectedWeek');
		let nextGame: TGame = {} as any;

		if (nextGameReady) nextGame = getNextGame.call({}, handleError);

		return {
			nextGame,
			pageReady: nextGameReady,
			selectedWeek,
		};
	},
)(withRouter(ViewSurvivor));
