'use strict';

import React from 'react';
import Helmet from 'react-helmet';

export const Loading = () => (
	<div className="white-box col-10 col-sm-10 col-md-6 col-xl-4">
		<Helmet title="Loading..." />
		<div className="row">
			<div className="text-center col-12">
				<h3>Loading&nbsp;&nbsp; <i className="fa fa-spinner fa-pulse" /></h3>
			</div>
		</div>
	</div>
);
