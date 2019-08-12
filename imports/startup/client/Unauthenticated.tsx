import React, { FC } from 'react';
import {
	Route,
	Redirect,
	RouteProps,
	RouteComponentProps,
} from 'react-router-dom';

export type TUnauthenticatedProps = RouteProps &
	RouteComponentProps & {
		authenticated: boolean;
		loggingIn: boolean;
	};

const Unauthenticated: FC<TUnauthenticatedProps> = ({
	authenticated,
	component: Component,
	location,
	loggingIn,
	...rest
}): JSX.Element => (
	<Route
		{...rest}
		render={(props): JSX.Element => {
			const { state = {} } = location;
			const { nextPathname } = state;

			if (!Component || loggingIn) return <></>;

			if (!authenticated) return <Component {...props} />;

			return <Redirect to={{ pathname: nextPathname || '/', state: {} }} />;
		}}
	/>
);

export default Unauthenticated;
