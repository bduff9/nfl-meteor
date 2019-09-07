import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import React, { FC } from 'react';
import ReactJson from 'react-json-view';

import { getAPICalls, TAPICall } from '../../api/collections/apicalls';
import { TWeek } from '../../api/commonTypes';
import { formatDate } from '../../api/global';
import { TResponseType } from '../pages/AdminAPICalls';

import Loading from './Loading';

export type TAdminAPICallsOuterProps = {
	responseType: TResponseType;
	sort: { [k: string]: -1 | 1 };
	toggleSortDirection: () => void;
	week: TWeek;
};
export type TAdminAPICallsProps = {
	apiCalls: TAPICall[];
	pageReady: boolean;
	sortDirection: -1 | 1;
	toggleSortDirection: () => void;
};

const AdminAPICallsTable: FC<TAdminAPICallsProps> = ({
	apiCalls,
	pageReady,
	sortDirection,
	toggleSortDirection,
}): JSX.Element => {
	return (
		<div className="col-12 px-0">
			{pageReady ? (
				<table className="table table-hover table-bordered admin-api-calls-table">
					<thead>
						<tr>
							<th>Response</th>
							<th>Error</th>
							<th className="sort-by" onClick={toggleSortDirection}>
								Date &nbsp;
								{sortDirection === -1 ? (
									<FontAwesomeIcon
										icon={['fad', 'sort-size-down']}
										fixedWidth
									/>
								) : (
									<FontAwesomeIcon icon={['fad', 'sort-size-up']} fixedWidth />
								)}
							</th>
							<th>Week</th>
							<th>Year</th>
							<th>URL</th>
						</tr>
					</thead>
					<tbody>
						{apiCalls.map(
							(apiCall): JSX.Element => (
								<tr key={apiCall._id}>
									<td>
										{apiCall.response && (
											<ReactJson
												collapsed
												src={apiCall.response}
												theme="shapeshifter"
											/>
										)}
									</td>
									<td>
										{apiCall.error && (
											<ReactJson
												collapsed
												src={apiCall.error}
												theme="shapeshifter"
											/>
										)}
									</td>
									<td>{formatDate(apiCall.date, true)}</td>
									<td>{apiCall.week}</td>
									<td>{apiCall.year}</td>
									<td>{apiCall.url}</td>
								</tr>
							),
						)}
					</tbody>
				</table>
			) : (
				<Loading />
			)}
		</div>
	);
};

AdminAPICallsTable.whyDidYouRender = true;

export default withTracker<TAdminAPICallsProps, TAdminAPICallsOuterProps>(
	({ responseType, sort, toggleSortDirection, week }): TAdminAPICallsProps => {
		//TODO: Figure out if any more functionality is needed to make this screen useful
		const filters: { [k: string]: any } = { week };

		if (responseType === 'ERROR') {
			filters.error = { $ne: null };
		} else if (responseType === 'SUCCESS') {
			filters.error = null;
		}

		const apiCallsHandle = Meteor.subscribe('apiCalls', filters, sort);
		const apiCallsReady = apiCallsHandle.ready();
		let apiCalls: TAPICall[] = [];

		if (apiCallsReady) apiCalls = getAPICalls.call({ filters, sort });

		return {
			apiCalls,
			pageReady: apiCallsReady,
			sortDirection: sort.date,
			toggleSortDirection,
		};
	},
)(AdminAPICallsTable);
