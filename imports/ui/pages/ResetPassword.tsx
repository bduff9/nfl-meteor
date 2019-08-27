import React, { FC } from 'react';
import Helmet from 'react-helmet';
import { RouteComponentProps } from 'react-router';

import ResetPasswordForm from '../components/ResetPasswordForm';

const ResetPassword: FC<RouteComponentProps<{ token: string }>> = ({
	history,
	match,
}) => (
	<div className="container-fluid reset-password">
		<div className="row">
			<Helmet title="Reset Password" />
			<div className="white-box col-11 col-sm-10 col-md-6">
				<div className="row">
					<div className="col-12">
						<h3 className="title-text text-center">Reset Password</h3>
					</div>
				</div>
				<ResetPasswordForm token={match.params.token} history={history} />
			</div>
		</div>
	</div>
);

ResetPassword.whyDidYouRender = true;

export default ResetPassword;
