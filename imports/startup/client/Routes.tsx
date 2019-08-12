import React, { ComponentType, FC, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

import Loading from '../../ui/components/Loading';
import AuthedLayout from '../../ui/layouts/AuthedLayout';

import Authenticated from './Authenticated';
import Unauthenticated from './Unauthenticated';

const Login = lazy(
	(): Promise<{
		default: ComponentType<{}>;
	}> => import('../../ui/pages/Login'),
);
const Logout = lazy(
	(): Promise<{
		default: ComponentType<{}>;
	}> => import('../../ui/pages/Logout'),
);
const NotFound = lazy(
	(): Promise<{
		default: ComponentType<{}>;
	}> => import('../../ui/pages/NotFound'),
);
const QuickPick = lazy(
	(): Promise<{
		default: ComponentType<{}>;
	}> => import('../../ui/pages/QuickPick'),
);
const ResetPassword = lazy(
	(): Promise<{
		default: ComponentType<{}>;
	}> => import('../../ui/pages/ResetPassword'),
);
const VerifyEmail = lazy(
	(): Promise<{
		default: ComponentType<{}>;
	}> => import('../../ui/pages/VerifyEmail'),
);

export type TRoutesProps = {
	authenticated: boolean;
	loggingIn: boolean;
};

const Routes: FC<TRoutesProps> = (props): JSX.Element => (
	<Suspense fallback={<Loading />}>
		<Router>
			<Switch>
				<Unauthenticated exact path="/login" component={Login} {...props} />
				<Route exact path="/logout" component={Logout} {...props} />
				<Route
					exact
					path="/quick-pick/:user_id/:team_short"
					component={QuickPick}
					{...props}
				/>
				<Route
					exact
					path="/reset-password/:token"
					component={ResetPassword}
					{...props}
				/>
				<Unauthenticated
					exact
					path="/verify-email/:token"
					component={VerifyEmail}
					{...props}
				/>
				<Authenticated path="/admin" component={AuthedLayout} {...props} />
				<Authenticated path="/picks" component={AuthedLayout} {...props} />
				<Authenticated path="/survivor" component={AuthedLayout} {...props} />
				<Authenticated path="/users" component={AuthedLayout} {...props} />
				<Authenticated exact path="/" component={AuthedLayout} {...props} />
				<Route component={NotFound} {...props} />
			</Switch>
		</Router>
	</Suspense>
);

export default Routes;
