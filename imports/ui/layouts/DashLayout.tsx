import React, { FC } from 'react';
import {
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	PieLabelRenderProps,
} from 'recharts';

import { TPick } from '../../api/collections/picks';
import { TTiebreaker } from '../../api/collections/tiebreakers';
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
	tied: boolean;
	tiedMe: number;
};
export type TDashboardUser = {
	_id: string;
	first_name: string;
	formattedPlace: string;
	last_name: string;
	missed_games: 'Y' | '';
	overall_place: number;
	overall_tied_flag: boolean;
	place: number;
	possible_points?: number;
	team_name: string;
	tiebreaker?: TTiebreaker;
	total_games: number;
	total_points: number;
};
export type TDashSort = {
	games_correct?: -1 | 1;
	points_earned?: -1 | 1;
	total_games?: -1 | 1;
	total_points?: -1 | 1;
};
export type TDashLayoutProps = {
	data: TDashboardUser[];
	highestScore: number;
	isOverall: boolean;
	myUser: TDashboardCurrentUser;
	pageReady: boolean;
	sort: TDashSort;
	changeSortBy: (s: TDashSort, f: string) => void;
};

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

	const _customLabel = ({ cx, cy }: PieLabelRenderProps): JSX.Element => (
		<text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
			{`${tied}${myPlace} / ${data.length}`}
		</text>
	);

	return (
		<div className="col-12 dashboard-layout">
			{pageReady ? (
				<div className="row text-center">
					{correctPoints ||
						incorrectPoints ||
						correctPicks.length ||
						(incorrectPicks.length && (
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
						))}
					{myPlace && (
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
										{pointsSort ? (
											<i
												className={
													'fa fa-sort-' + (pointsSort === 1 ? 'asc' : 'desc')
												}
											/>
										) : null}
									</th>
									<th
										className="can-sort"
										onClick={(): void => changeSortBy(sort, 'games')}
									>
										Games Correct&nbsp;
										{gamesSort ? (
											<i
												className={
													'fa fa-sort-' + (gamesSort === 1 ? 'asc' : 'desc')
												}
											/>
										) : null}
									</th>
									{isOverall ? <th>Missed Games?</th> : null}
									{!isOverall ? <th>Tiebreaker</th> : null}
									{!isOverall ? <th>Last Game</th> : null}
									{!isOverall ? <th>Elim</th> : null}
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

export default DashLayout;
