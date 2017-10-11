'use strict';

import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import AuthedLayout from '../../ui/layouts/AuthedLayout';
import Authenticated from './Authenticated';
import Login from '../../ui/pages/Login';
import Logout from '../../ui/pages/Logout';
import NotFound from '../../ui/pages/NotFound';
import QuickPick from '../../ui/pages/QuickPick';
import ResetPassword from '../../ui/pages/ResetPassword';
import Unauthenticated from './Unauthenticated';
import VerifyEmail from '../../ui/pages/VerifyEmail';

export const Routes = props => (
	<Router>
		<Switch>
			<Unauthenticated exact path="/login" component={Login} {...props} />
			<Authenticated exact path="/logout" component={Logout} {...props} />
			<Route exact path="/quick-pick/:user_id/:team_short" component={QuickPick} {...props} />
			<Route exact path="/reset-password/:token" component={ResetPassword} {...props} />
			<Route exact path="/verify-email/:token" component={VerifyEmail} {...props} />
			<Authenticated path="/" component={AuthedLayout} />
			<Route component={NotFound} {...props} />
		</Switch>
	</Router>
);
