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
			<Route exact path="/logout" component={Logout} {...props} />
			<Route exact path="/quick-pick/:user_id/:team_short" component={QuickPick} {...props} />
			<Route exact path="/reset-password/:token" component={ResetPassword} {...props} />
			<Unauthenticated exact path="/verify-email/:token" component={VerifyEmail} {...props} />
			<Authenticated path="/admin" component={AuthedLayout} {...props} />
			<Authenticated path="/picks" component={AuthedLayout} {...props} />
			<Authenticated path="/survivor" component={AuthedLayout} {...props} />
			<Authenticated path="/users" component={AuthedLayout} {...props} />
			<Authenticated exact path="/" component={AuthedLayout} {...props} />
			<Route component={NotFound} {...props} />
		</Switch>
	</Router>
);
