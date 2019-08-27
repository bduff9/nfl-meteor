import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { FC } from 'react';
import {
	Pie,
	PieChart,
	// eslint-disable-next-line import/named
	PieLabelRenderProps,
	ResponsiveContainer,
	Tooltip,
} from 'recharts';

import { TPick } from '../../api/collections/picks';
import { TTiebreaker } from '../../api/collections/tiebreakers';
import { TWeek } from '../../api/commonTypes';
import { TDashSortBy } from '../pages/Dashboard';
import Loading from '../pages/Loading';

export type TDashboardCurrentUser = {
	_id: string;
	aheadOfMe: number;
	behindMe: number;
	correctPicks: TPick[];
	correctPoints: number;
	incorrectPicks: TPick[];
	incorrectPoints: number;
	myPlace: number;
	overall_place?: number;
	overall_tied_flag?: '' | 'T';
	tied: '' | 'T';
	tiedMe: number;
};
export type TDashboardUser = {
	_id: string;
	first_name: string;
	formattedPlace: string;
	last_name: string;
	missed_games?: 'Y' | '';
	overall_place?: number;
	overall_tied_flag?: boolean;
	place: number;
	possible_games?: number;
	possible_points?: number;
	team_name: string;
	tiebreaker?: TTiebreaker;
	total_games: number;
	total_points: number;
};
export type TDashLayoutProps = {
	changeSortBy: (s: TDashSortBy, f: string) => void;
	data: TDashboardUser[];
	highestScore: number;
	myTiebreaker?: TTiebreaker;
	myUser: TDashboardCurrentUser;
	pageReady: boolean;
	sort: TDashSortBy;
} & ({ isOverall: true } | { isOverall: false; week: TWeek });

const DashLayout: FC<TDashLayoutProps> = ({
	data,
	highestScore,
	isOverall,
	myUser,
	pageReady,
	sort,
	changeSortBy,
}): JSX.Element => {
	const gamesSort = sort.total_games || sort.games_correct;
	const pointsSort = sort.total_points || sort.points_earned;
	const {
		aheadOfMe,
		behindMe,
		correctPicks,
		correctPoints,
		incorrectPicks,
		incorrectPoints,
		myPlace,
		tied,
		tiedMe,
		_id: userId,
	} = myUser;
	const picksAndPointsSum =
		correctPoints +
		incorrectPoints +
		(correctPicks ? correctPicks.length : 0) +
		(incorrectPicks ? incorrectPicks.length : 0);
	const hasData = picksAndPointsSum > 0;

	const _customLabel = ({ cx, cy }: PieLabelRenderProps): JSX.Element => (
		<text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
			{`${tied}${myPlace} / ${data.length}`}
		</text>
	);

	return (
		<div className="col-12 dashboard-layout">
			{pageReady ? (
				<div className="row text-center">
					{hasData && (
						<div className="col-12 col-md-6">
							<ResponsiveContainer height={200}>
								<PieChart margin={{ left: 10, right: 10 }}>
									<Pie
										data={[
											{
												name: 'Points Earned',
												value: correctPoints,
												fill: '#5cb85c',
											},
											{
												name: 'Points Missed',
												value: incorrectPoints,
												fill: '#d9534f',
											},
										]}
										dataKey="value"
										outerRadius="70%"
									/>
									<Pie
										data={[
											{
												name: 'Games Correct',
												value: correctPicks.length,
												fill: '#5cb85c',
											},
											{
												name: 'Games Incorrect',
												value: incorrectPicks.length,
												fill: '#d9534f',
											},
										]}
										dataKey="value"
										innerRadius="80%"
										outerRadius="100%"
										label
									/>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
							<h4>My Results</h4>
							<span className="text-muted">
								Outer: Games correct vs. incorrect
							</span>
							<br />
							<span className="text-muted">
								Inner: Points correct vs. incorrect
							</span>
						</div>
					)}
					{!!myPlace && data.length > 1 && (
						<div className="col-12 col-md-6">
							<ResponsiveContainer height={200}>
								<PieChart margin={{ left: 10, right: 10 }}>
									<Pie
										data={[
											{
												name: 'Ahead of me',
												value: aheadOfMe,
												fill: '#d9534f',
											},
											{ name: 'Tied with me', value: tiedMe, fill: '#f0ad4e' },
											{ name: 'I am ahead', value: behindMe, fill: '#5cb85c' },
										]}
										dataKey="value"
										innerRadius="87%"
										outerRadius="100%"
										activeIndex={1}
										label={_customLabel}
										labelLine={false}
									/>
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
							<h4>My Place</h4>
							<span className="text-muted">Where you stand</span>
							<br />
							<span className="text-muted" />
						</div>
					)}
					<div className="col-12 dashboard-table-parent">
						<table className="table table-hover dashboard-table">
							<thead className="thead-default">
								<tr>
									<th>Rank</th>
									<th>Team</th>
									<th>Owner</th>
									<th
										className="can-sort"
										onClick={(): void => changeSortBy(sort, 'points')}
									>
										Points Earned&nbsp;
										{pointsSort === 1 && (
											<FontAwesomeIcon icon={['fad', 'sort-size-up']} />
										)}
										{pointsSort === -1 && (
											<FontAwesomeIcon icon={['fad', 'sort-size-down']} />
										)}
									</th>
									<th
										className="can-sort"
										onClick={(): void => changeSortBy(sort, 'games')}
									>
										Games Correct&nbsp;
										{gamesSort === 1 && (
											<FontAwesomeIcon icon={['fad', 'sort-size-up']} />
										)}
										{gamesSort === -1 && (
											<FontAwesomeIcon icon={['fad', 'sort-size-down']} />
										)}
									</th>
									{isOverall ? (
										<th>Missed Games?</th>
									) : (
										<>
											<th>Tiebreaker</th>
											<th>Last Game</th>
											<th>Elim</th>
										</>
									)}
								</tr>
							</thead>
							<tbody>
								{data.map(
									(row): JSX.Element => (
										<tr
											className={row._id === userId ? 'my-place' : undefined}
											key={`place-${row._id}`}
										>
											<td>{row.formattedPlace}</td>
											<td>{row.team_name || `${row.first_name}'s Team`}</td>
											<td>{`${row.first_name} ${row.last_name}`}</td>
											<td>{row.total_points}</td>
											<td>{row.total_games}</td>
											{isOverall ? (
												<td>{row.missed_games}</td>
											) : (
												<>
													<td>{row.tiebreaker && row.tiebreaker.last_score}</td>
													<td>
														{row.tiebreaker && row.tiebreaker.last_score_act}
													</td>
													<td>
														{row.possible_points &&
														row.possible_points < highestScore
															? 'X'
															: ''}
													</td>
												</>
											)}
										</tr>
									),
								)}
							</tbody>
						</table>
					</div>
				</div>
			) : (
				<Loading />
			)}
		</div>
	);
};

DashLayout.whyDidYouRender = true;

export default DashLayout;
