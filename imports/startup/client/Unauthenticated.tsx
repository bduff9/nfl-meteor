import { Meteor } from 'meteor/meteor';
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
	};

const Unauthenticated: FC<TUnauthenticatedProps> = ({
	authenticated,
	component: Component,
	location,
	...rest
}): JSX.Element => (
	<Route
		{...rest}
		render={(props): JSX.Element => {
			const { state = {} } = location;
			const { nextPathname } = state;
			const loggingIn = Meteor.loggingIn();

			if (!Component || loggingIn) return <></>;

			if (!authenticated) return <Component {...props} />;

			return <Redirect to={{ pathname: nextPathname || '/', state: {} }} />;
		}}
	/>
);

Unauthenticated.whyDidYouRender = true;

export default Unauthenticated;
