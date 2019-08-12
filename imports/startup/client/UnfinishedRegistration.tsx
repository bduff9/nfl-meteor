import { Meteor } from 'meteor/meteor';
import React, { FC } from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';

import { TUser } from '../../api/collections/users';

export type TUnfinishedRegistrationProps = RouteProps & {
	authenticated: boolean;
	loggingIn: boolean;
};

const UnfinishedRegistration: FC<TUnfinishedRegistrationProps> = ({
	authenticated,
	component: Component,
	loggingIn,
	...rest
}): JSX.Element => (
	<Route
		{...rest}
		render={(props): JSX.Element => {
			// @ts-ignore
			const currentUser: TUser | null = Meteor.user();

			if (!Component || loggingIn) return <></>;

			if (authenticated && currentUser && !currentUser.done_registering)
				return <Component {...props} />;

			return <Redirect to="/" />;
		}}
	/>
);

export default UnfinishedRegistration;
