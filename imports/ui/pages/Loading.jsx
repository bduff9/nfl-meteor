'use strict';

import React from 'react';
import Helmet from 'react-helmet';

export const Loading = () => {
	return (
		<div className="col-xs">
			<Helmet title="Loading..." />
			<div className="white-box col-xs-10 col-sm-10 col-md-6 col-xl-4">
				<div className="row">
					<div className="text-xs-center col-xs-12">
						<h3>Loading&nbsp;&nbsp; <i className="fa fa-spinner fa-pulse" /></h3>
					</div>
				</div>
			</div>
		</div>
	);
};
