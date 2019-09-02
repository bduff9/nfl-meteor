import { Session } from 'meteor/session';
import React, { FC, useState } from 'react';
import Helmet from 'react-helmet';

import AdminAPICallsTable from '../components/AdminAPICallsTable';

export type TResponseType = 'BOTH' | 'ERROR' | 'SUCCESS';

const AdminAPICalls: FC<{}> = (): JSX.Element => {
	const selectedWeek = Session.get('selectedWeek');
	const [showResponseType, setShowReponseType] = useState<TResponseType>(
		'BOTH',
	);
	const [sortDescending, setSortDescending] = useState<boolean>(true);

	return (
		<div className="row admin-wrapper admin-api-calls-wrapper">
			<Helmet title="View API Call History" />
			<div className="col-12">
				<h3 className="title-text text-center text-md-left d-md-none">
					API Calls
				</h3>
				<div className="btn-group" role="group" aria-label="Filter Users">
					<button
						type="button"
						className="btn btn-info"
						disabled={showResponseType === 'BOTH'}
						onClick={(): void => setShowReponseType('BOTH')}
					>
						All
					</button>
					<button
						type="button"
						className="btn btn-info"
						disabled={showResponseType === 'SUCCESS'}
						onClick={(): void => setShowReponseType('SUCCESS')}
					>
						Success Only
					</button>
					<button
						type="button"
						className="btn btn-info"
						disabled={showResponseType === 'ERROR'}
						onClick={(): void => setShowReponseType('ERROR')}
					>
						Error Only
					</button>
				</div>
				<AdminAPICallsTable
					responseType={showResponseType}
					sort={{ date: sortDescending ? -1 : 1 }}
					toggleSortDirection={(): void => setSortDescending(!sortDescending)}
					week={selectedWeek}
				/>
			</div>
		</div>
	);
};

AdminAPICalls.whyDidYouRender = true;

export default AdminAPICalls;
