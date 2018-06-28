'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { Loading } from '../pages/Loading.jsx';

export const DashLayout = ({ data, highestScore, isOverall, myTiebreaker, myUser, pageReady, sort, _changeSortBy }) => {
	const gamesSort = sort.total_games || sort.games_correct;
	const pointsSort = sort.total_points || sort.points_earned;
	const { aheadOfMe, behindMe, correctPicks, correctPoints, incorrectPicks, incorrectPoints, myPlace, tied, tiedMe, _id: userId } = myUser;
	const _customLabel = ({ cx, cy }) => {
		_customLabel.propTypes = {
			cx: PropTypes.number.isRequired,
			cy: PropTypes.number.isRequired,
		};

		return (
			<text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
				{`${tied}${myPlace} / ${data.length}`}
			</text>
		);
	};

	return (
		<div className="col-12 dashboard-layout">
			{pageReady ? (
				<div className="row text-center">
					{correctPoints || incorrectPoints || correctPicks.length || incorrectPicks.length ?
						<div className="col-12 col-md-6">
							<ResponsiveContainer height={200}>
								<PieChart margin={{ left: 10, right: 10 }}>
									<Pie data={[
										{ name: 'Points Earned', value: correctPoints, fill: '#5cb85c' },
										{ name: 'Points Missed', value: incorrectPoints, fill: '#d9534f' },
									]} outerRadius="70%" />
									<Pie data={[
										{ name: 'Games Correct', value: correctPicks.length, fill: '#5cb85c' },
										{ name: 'Games Incorrect', value: incorrectPicks.length, fill: '#d9534f' },
									]} innerRadius="80%" outerRadius="100%" label />
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
							<h4>My Results</h4>
							<span className="text-muted">Outer: Games correct vs. incorrect</span>
							<br />
							<span className="text-muted">Inner: Points correct vs. incorrect</span>
						</div>
						:
						null
					}
					{myPlace ?
						<div className="col-12 col-md-6">
							<ResponsiveContainer height={200}>
								<PieChart margin={{ left: 10, right: 10 }}>
									<Pie data={[
										{ name: 'Ahead of me', value: aheadOfMe, fill: '#d9534f' },
										{ name: 'Tied with me', value: tiedMe, fill: '#f0ad4e' },
										{ name: 'I am ahead', value: behindMe, fill: '#5cb85c' },
									]} innerRadius="87%" outerRadius="100%" activeIndex={1} label={_customLabel} labelLine={false} />
									<Tooltip />
								</PieChart>
							</ResponsiveContainer>
							<h4>My Place</h4>
							<span className="text-muted">Where you stand</span>
							<br />
							<span className="text-muted"></span>
						</div>
						:
						null
					}
					<div className="col-12 dashboard-table-parent">
						<table className="table table-hover dashboard-table">
							<thead className="thead-default">
								<tr>
									<th>Rank</th>
									<th>Team</th>
									<th>Owner</th>
									<th className="can-sort" onClick={_changeSortBy.bind(null, sort, 'points')}>
										Points Earned&nbsp;
										{pointsSort ? <i className={'fa fa-sort-' + (pointsSort === 1 ? 'asc' : 'desc')} /> : null}
									</th>
									<th className="can-sort" onClick={_changeSortBy.bind(null, sort, 'games')}>
										Games Correct&nbsp;
										{gamesSort ? <i className={'fa fa-sort-' + (gamesSort === 1 ? 'asc' : 'desc')} /> : null}
									</th>
									{isOverall ? <th>Missed Games?</th> : null}
									{!isOverall ? <th>Tiebreaker</th> : null}
									{!isOverall ? <th>Last Game</th> : null}
									{!isOverall ? <th>Elim</th> : null}
								</tr>
							</thead>
							<tbody>
								{data.map((row, i) => {
									return (
										<tr className={row._id === userId ? 'my-place' : null} key={'place' + i}>
											<td>{row.formattedPlace}</td>
											<td>{row.team_name || `${row.first_name}'s Team`}</td>
											<td>{`${row.first_name} ${row.last_name}`}</td>
											<td>{row.total_points}</td>
											<td>{row.total_games}</td>
											{isOverall ? <td>{row.missed_games}</td> : null}
											{!isOverall ? <td>{row.tiebreaker.last_score}</td> : null}
											{!isOverall ? <td>{row.tiebreaker.last_score_act}</td> : null}
											{!isOverall ? <td>{row.possible_points < highestScore ? 'X' : ''}</td> : null}
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				</div>
			)
				:
				<Loading />
			}
		</div>
	);
};

DashLayout.propTypes = {
	data: PropTypes.arrayOf(PropTypes.object).isRequired,
	highestScore: PropTypes.number,
	isOverall: PropTypes.bool.isRequired,
	myTiebreaker: PropTypes.object,
	myUser: PropTypes.object.isRequired,
	pageReady: PropTypes.bool.isRequired,
	sort: PropTypes.object.isRequired,
	week: PropTypes.number,
	_changeSortBy: PropTypes.func.isRequired,
};
