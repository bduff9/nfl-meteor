import { Meteor } from 'meteor/meteor';
import React, { FC } from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';

import { TUser } from '../../api/collections/users';

const AdminOnly: FC<RouteProps> = ({
	component: Component,
	...rest
}): JSX.Element => (
	<Route
		{...rest}
		render={(props): JSX.Element => {
			const loggingIn = Meteor.loggingIn();
			// @ts-ignore
			const currentUser: TUser | null = Meteor.user();
			const authenticated = !loggingIn && !!currentUser;

			if (!Component || loggingIn) return <></>;

			if (authenticated && currentUser && currentUser.is_admin)
				return <Component {...props} />;

			return <Redirect to="/" />;
		}}
	/>
);

export default AdminOnly;
