'use strict';

import React from 'react';
import { NavLink } from 'react-router-dom';
import Helmet from 'react-helmet';

const Logout = () => {

	return (
		<div className="row">
			<Helmet title="Logged Out" />
			<div className="white-box col-11 col-sm-10 col-md-6 col-xl-4 logout-box">
				<div className="row">
					<div className="text-center col-12">
						<h3>You have been successfully logged out</h3>
					</div>
				</div>
				<div className="row">
					<div className="text-center col">
						<NavLink to="/login">Return to Sign-in</NavLink>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Logout;
