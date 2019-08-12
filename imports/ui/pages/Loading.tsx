import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { FC } from 'react';
import Helmet from 'react-helmet';

const Loading: FC<{}> = (): JSX.Element => (
	<div className="white-box col-10 col-sm-10 col-md-6 col-xl-4">
		<Helmet title="Loading..." />
		<div className="row">
			<div className="text-center col-12">
				<h3>
					Loading&nbsp;&nbsp; <FontAwesomeIcon icon="spinner" pulse />
				</h3>
			</div>
		</div>
	</div>
);

export default Loading;
