'use strict';

import React, { PropTypes } from 'react';
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { sortForDash } from '../../api/global';
import { Loading } from '../pages/Loading.jsx';

export const DashLayout = ({ data, highestScore, isOverall, myTiebreaker, myUser, pageReady, sort, week, _changeSortBy }) => {
	const gamesSort = sort.total_games || sort['tiebreakers.$.games_correct'],
			pointsSort = sort.total_points || sort['tiebreakers.$.points_earned'],
			{ aheadOfMe, behindMe, correctPicks, correctPoints, incorrectPicks, incorrectPoints, myPlace, tied, tiedMe, userId } = myUser,
			correctPicks = myPicks.filter(pick => pick.winner_id && pick.pick_id === pick.winner_id),
			incorrectPicks = myPicks.filter(pick => pick.winner_id && pick.pick_id !== pick.winner_id),
			correctPoints = correctPicks.reduce((prev, pick) => {
				return prev + pick.points;
			}, 0),
			incorrectPoints = incorrectPicks.reduce((prev, pick) => {
				if (pick.points) return prev + pick.points;
				return prev;
			}, 0),
			myPlace = (isOverall ? myUser.overall_place : myTiebreaker.place_in_week),
			userId = myUser._id;
	let tied = '',
			aheadOfMe = 0,
			tiedMe = 0,
			behindMe = 0;
	if (isOverall && myUser.overall_tied_flag) tied = 'T';
	if (!isOverall && myTiebreaker && myTiebreaker.tied_flag) tied = 'T';

	const _customLabel = ({ cx, cy }) => {
		_customLabel.propTypes = {
			cx: PropTypes.number.isRequired,
			cy: PropTypes.number.isRequired
		};

		return (
			<text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
				{`${tied}${myPlace} / ${data.length}`}
			</text>
		);
	};

	//TODO: Move up one level to week and overall dash
	data.sort(sortForDash.bind(null, pointsSort, gamesSort)).forEach(u => {
		const place = (isOverall ? u.overall_place : u.tiebreaker.place_in_week);
		if (place < myPlace) aheadOfMe++;
		if (place === myPlace && u._id !== userId) tiedMe++;
		if (place > myPlace) behindMe++;
	});

	return (
		<div className="col-xs-12 dashboard-layout">
			{pageReady ? (
				<div className="row text-xs-center">
					{correctPoints || incorrectPoints || correctPicks || incorrectPicks ?
						<div className="col-xs-12 col-md-6">
							<ResponsiveContainer height={200}>
								<PieChart margin={{ left: 10, right: 10 }}>
									<Pie data={[
										{ name: 'Points Earned', value: correctPoints, fill: '#5cb85c' },
										{ name: 'Points Missed', value: incorrectPoints, fill: '#d9534f' }
									]} outerRadius="70%" />
									<Pie data={[
										{ name: 'Games Correct', value: correctPicks, fill: '#5cb85c' },
										{ name: 'Games Incorrect', value: incorrectPicks, fill: '#d9534f' }
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
						<div className="col-xs-12 col-md-6">
							<ResponsiveContainer height={200}>
								<PieChart margin={{ left: 10, right: 10 }}>
									<Pie data={[
										{ name: 'Ahead of me', value: aheadOfMe, fill: '#d9534f' },
										{ name: 'Tied with me', value: tiedMe, fill: '#f0ad4e' },
										{ name: 'I am ahead', value: behindMe, fill: '#5cb85c' }
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
					<div className="col-xs-12 dashboard-table-parent">
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
											<td>{row.place}</td>
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
	myTiebreaker: PropTypes.object.isRequired,
	myUser: PropTypes.object.isRequired,
	pageReady: PropTypes.bool.isRequired,
	sort: PropTypes.object.isRequired,
	user: PropTypes.object.isRequired,
	week: PropTypes.number,
	_changeSortBy: PropTypes.func.isRequired
};
