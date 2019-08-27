import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Session } from 'meteor/session';
import React, { FC, useState, FormEvent } from 'react';
import Helmet from 'react-helmet';

import { getUsers, TUser } from '../../api/collections/users';
import { DEFAULT_LEAGUE } from '../../api/constants';
import ViewHistory from '../components/ViewHistory';
import WeeklyStats from '../components/WeeklyStats';

import Loading from './Loading';

export type TStatisticsProps = {
	currentLeague: string;
	pageReady: boolean;
	poolYears: number[];
	selectedWeek: number;
};

const Statistics: FC<TStatisticsProps> = ({
	currentLeague,
	pageReady,
	poolYears,
	selectedWeek,
}): JSX.Element => {
	const [display, setDisplay] = useState<string>('');
	const pageTitle = 'Pool Stats';

	const _updateDisplay = (ev: FormEvent<HTMLSelectElement>): void => {
		setDisplay(ev.currentTarget.value);
	};

	return (
		<div className="row statistics-wrapper">
			<Helmet title={pageTitle} />
			<h3 className="title-text text-center col-12 d-md-none">{pageTitle}</h3>
			{pageReady ? (
				<div className="col-12 statistics">
					<select
						className="form-control"
						value={display}
						onChange={_updateDisplay}
					>
						<option value="">Current Year (Week {selectedWeek})</option>
						{poolYears.map(
							(year): JSX.Element => (
								<option value={year} key={`year-${year}`}>
									{year}
								</option>
							),
						)}
					</select>
					{display === '' ? (
						<WeeklyStats
							currentLeague={currentLeague}
							selectedWeek={selectedWeek}
						/>
					) : (
						<ViewHistory
							currentLeague={currentLeague}
							year={parseInt(display, 10)}
						/>
					)}
				</div>
			) : (
				<Loading />
			)}
		</div>
	);
};

Statistics.whyDidYouRender = true;

export default withTracker<TStatisticsProps, {}>(
	(): TStatisticsProps => {
		const selectedWeek = Session.get('selectedWeek');
		const currentLeague = DEFAULT_LEAGUE; //Session.get('selectedLeague'); //TODO: Eventually will need to uncomment this and allow them to change current league
		const usersHandle = Meteor.subscribe('usersForHistory');
		const usersReady = usersHandle.ready();
		let poolYears: number[] = [];
		let allUsers: TUser[];

		if (usersReady) {
			allUsers = getUsers.call({ activeOnly: true, league: currentLeague });

			poolYears = allUsers
				.reduce(
					(years: number[], user): number[] => user.years_played.concat(years),
					[],
				)
				.filter((year, i, allYears): boolean => allYears.indexOf(year) === i)
				.sort()
				.reverse()
				.slice(1);
		}

		return {
			currentLeague,
			pageReady: !!selectedWeek && usersReady,
			poolYears,
			selectedWeek,
		};
	},
)(Statistics);
