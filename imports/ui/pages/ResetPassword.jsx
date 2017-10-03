'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';

import ResetPasswordForm from '../components/ResetPasswordForm';

const ResetPassword = ({ routeParams }, { router }) => (
	<div className="container-fluid reset-password">
		<div className="row">
			<Helmet title="Reset Password" />
			<div className="white-box col-xs-11 col-sm-10 col-md-6">
				<div className="row">
					<div className="col-xs-12">
						<h3 className="title-text text-xs-center">Reset Password</h3>
					</div>
				</div>
				<ResetPasswordForm routeParams={routeParams} router={router} />
			</div>
		</div>
	</div>
);

ResetPassword.propTypes = {
	routeParams: PropTypes.object.isRequired
};

ResetPassword.contextTypes = {
	router: PropTypes.object.isRequired
};

export default ResetPassword;
