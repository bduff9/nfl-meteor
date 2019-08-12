import { Meteor } from 'meteor/meteor';
import React, { FC } from 'react';
import {
	Route,
	Redirect,
	RouteComponentProps,
	RouteProps,
} from 'react-router-dom';

import { TUser } from '../../api/collections/users';

export type TAuthenticatedProps = RouteProps &
	RouteComponentProps & {
		authenticated: boolean;
		loggingIn: boolean;
	};

const Authenticated: FC<TAuthenticatedProps> = ({
	authenticated,
	component: Component,
	location,
	loggingIn,
	...rest
}): JSX.Element => (
	<Route
		{...rest}
		render={(props): JSX.Element => {
			const { pathname } = location;
			// @ts-ignore
			const currentUser: TUser | null = Meteor.user();

			console.log('authenticated');

			if (!Component || loggingIn) return <></>;

			if (
				pathname !== '/users/create' &&
				authenticated &&
				currentUser &&
				!currentUser.done_registering
			)
				return <Redirect to="/users/create" />;

			if (authenticated) return <Component {...props} />;

			return (
				<Redirect
					to={{
						pathname: '/login',
						state: { nextPathname: location.pathname },
					}}
				/>
			);
		}}
	/>
);

export default Authenticated;
