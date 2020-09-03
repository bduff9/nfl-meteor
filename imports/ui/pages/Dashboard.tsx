import { withTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import React, { FC, useState, FormEvent } from 'react';
import Helmet from 'react-helmet';

import { updateSelectedWeek } from '../../api/collections/users';
import { TWeek } from '../../api/commonTypes';
import { DEFAULT_LEAGUE, WEEKS_IN_SEASON } from '../../api/constants';
import { handleError } from '../../api/global';
import OverallDash from '../components/OverallDash';
import WeekDash from '../components/WeekDash';

import Loading from './Loading';

export type TDashboardProps = {
	currentLeague: string;
	pageReady: boolean;
	selectedWeek: number;
};
export type TSortByDir = -1 | 1 | undefined;
export type TDashSortBy = {
	by_place?: TSortByDir;
	total_games?: TSortByDir;
	total_points?: TSortByDir;
	games_correct?: TSortByDir;
	points_earned?: TSortByDir;
};

const Dashboard: FC<TDashboardProps> = ({
	currentLeague,
	pageReady,
	selectedWeek,
}): JSX.Element => {
	const [sortBy, setSortBy] = useState<TDashSortBy | null>(null);
	const [viewOverall, setViewOverall] = useState<boolean>(false);

	const _nextOrd = (num: TSortByDir, otherNum?: TSortByDir): TSortByDir => {
		if (num === 1) return -1;

		if (num === -1 && otherNum) return undefined;

		return 1;
	};

	const _changeSortBy = (currSort: TDashSortBy, col: string): void => {
		let newSort = Object.assign({}, currSort);
		const {
			// eslint-disable-next-line @typescript-eslint/camelcase
			by_place,
			// eslint-disable-next-line @typescript-eslint/camelcase
			total_games,
			// eslint-disable-next-line @typescript-eslint/camelcase
			total_points,
			// eslint-disable-next-line @typescript-eslint/camelcase
			games_correct: week_games,
			// eslint-disable-next-line @typescript-eslint/camelcase
			points_earned: week_points,
		} = newSort;

		if (col === 'place') {
			// eslint-disable-next-line @typescript-eslint/camelcase
			newSort = { by_place: _nextOrd(by_place) };
		} else if (col === 'games') {
			delete newSort.by_place;

			if (viewOverall) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				newSort.total_games = _nextOrd(total_games, total_points);
			} else {
				// eslint-disable-next-line @typescript-eslint/camelcase
				newSort.games_correct = _nextOrd(week_games, week_points);
			}
		} else if (col === 'points') {
			delete newSort.by_place;

			if (viewOverall) {
				// eslint-disable-next-line @typescript-eslint/camelcase
				newSort.total_points = _nextOrd(total_points, total_games);
			} else {
				// eslint-disable-next-line @typescript-eslint/camelcase
				newSort.points_earned = _nextOrd(week_points, week_games);
			}
		}

		setSortBy(newSort);
	};

	const _selectWeek = (ev: FormEvent<HTMLSelectElement>): void => {
		const newWeek = parseInt(ev.currentTarget.value, 10);

		ev.preventDefault();

		updateSelectedWeek.call({ week: newWeek }, handleError);
	};

	const _toggleOverall = (ev: FormEvent<HTMLSelectElement>): void => {
		const viewOverall = ev.currentTarget.value === 'true';

		setSortBy(null);
		setViewOverall(viewOverall);
	};

	return (
		<div className="row dashboard-wrapper">
			<Helmet title={'My Dashboard'} />
			<h3 className="title-text text-center col-12 d-md-none">My Dashboard</h3>
			{pageReady ? (
				<div className="col-12 dashboard">
					<div className="row">
						<div className="col-6">
							<div className="form-group">
								<label htmlFor="view-overall">View:</label>
								<select
									className="form-control"
									id="view-overall"
									value={'' + viewOverall}
									onChange={_toggleOverall}
								>
									<option value="true">Overall</option>
									<option value="false">Week</option>
								</select>
							</div>
						</div>
						<div className="col-6">
							<div className="form-group">
								<label htmlFor="select-week-for-dashboard">Jump to:</label>
								<select
									className="form-control"
									value={selectedWeek}
									onChange={_selectWeek}
								>
									{[...Array(WEEKS_IN_SEASON)].map(
										(_, i): JSX.Element => (
											<option value={i + 1} key={'week' + (i + 1)}>
												{`Week ${i + 1}`}
											</option>
										),
									)}
								</select>
							</div>
						</div>
					</div>
					{viewOverall ? (
						<OverallDash
							league={currentLeague}
							sortBy={sortBy}
							changeSortBy={_changeSortBy}
						/>
					) : (
						<WeekDash
							league={currentLeague}
							sortBy={sortBy}
							week={selectedWeek as TWeek}
							changeSortBy={_changeSortBy}
						/>
					)}
				</div>
			) : (
				<Loading />
			)}
		</div>
	);
};

Dashboard.whyDidYouRender = true;

export default withTracker(
	(): TDashboardProps => {
		const selectedWeek = Session.get('selectedWeek');
		const currentLeague = DEFAULT_LEAGUE; //Session.get('selectedLeague'); //TODO: Eventually will need to uncomment this and allow them to change current league

		return {
			currentLeague,
			pageReady: !!selectedWeek,
			selectedWeek,
		};
	},
)(Dashboard);
