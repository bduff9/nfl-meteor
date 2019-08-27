import React, { FC } from 'react';
import {
	Bar,
	BarChart,
	Cell,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

import { TWeek } from '../../api/commonTypes';
import Loading from '../pages/Loading';

export type TSurvivorUser = {
	_id: string;
	first_name: string;
	last_name: string;
	pick_short: string;
};
export type TGraphData = {
	count: number;
	[k: string]: string | number | boolean;
};
export type TSurvivorLayoutProps = {
	alive: TSurvivorUser[];
	dead: TSurvivorUser[];
	graphData: TGraphData[];
	pageReady: boolean;
	weekForSec: TWeek;
} & (
	| {
			isOverall: true;
	  }
	| {
			isOverall: false;
			week: TWeek;
	  });

export const SurvivorLayout: FC<TSurvivorLayoutProps> = ({
	alive,
	dead,
	graphData,
	isOverall,
	pageReady,
}): JSX.Element => (
	<div className="col-12 survivor-layout">
		{pageReady ? (
			<div>
				<table className="table table-hover view-survivor-table">
					<thead>
						<tr>
							<th>Surviving</th>
							<th>Dead</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<ul className="text-success alive">
									{alive.map(
										(user): JSX.Element => (
											<li key={`survivor-${user._id}`}>
												<span>{`${user.first_name} ${user.last_name}${
													isOverall ? '' : ` - ${user.pick_short}`
												}`}</span>
											</li>
										),
									)}
								</ul>
							</td>
							<td>
								<ul className="text-danger dead">
									{dead.map(
										(user): JSX.Element => (
											<li key={`survivor-${user._id}`}>
												<span>{`${user.first_name} ${user.last_name}${
													isOverall ? '' : ` - ${user.pick_short || 'N/A'}`
												}`}</span>
											</li>
										),
									)}
								</ul>
							</td>
						</tr>
					</tbody>
				</table>
				{isOverall ? (
					<ResponsiveContainer height={300}>
						<LineChart
							data={graphData}
							margin={{ top: 5, right: 40, bottom: 5, left: 0 }}
						>
							{alive.map(
								(user): JSX.Element => (
									<Line
										type="monotone"
										dataKey={`${user.first_name} ${user.last_name}`}
										stroke="#0f0"
										key={`line-${user._id}`}
									/>
								),
							)}
							{dead.map(
								(user): JSX.Element => (
									<Line
										type="monotone"
										dataKey={`${user.first_name} ${user.last_name}`}
										stroke="#f00"
										key={`line-${user._id}`}
									/>
								),
							)}
							<XAxis dataKey="x" type="category" />
							<YAxis type="category" />
							<Tooltip />
						</LineChart>
					</ResponsiveContainer>
				) : (
					<ResponsiveContainer height={300}>
						<BarChart data={graphData}>
							<Bar dataKey="count">
								{graphData.map(
									(team): JSX.Element => (
										<Cell
											fill={team.won ? '#0f0' : team.lost ? '#f00' : '#999'}
											key={'line' + team.team}
										/>
									),
								)}
							</Bar>
							<XAxis dataKey="team" type="category" />
							<YAxis allowDecimals={false} type="number" />
							<Tooltip />
						</BarChart>
					</ResponsiveContainer>
				)}
			</div>
		) : (
			<Loading />
		)}
	</div>
);

SurvivorLayout.whyDidYouRender = true;

export default SurvivorLayout;
