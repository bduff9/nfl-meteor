import { Accounts } from 'meteor/accounts-base';
import { Bert } from 'meteor/themeteorchef:bert';
import React, { FC } from 'react';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import { TError } from '../../api/commonTypes';
import { handleError } from '../../api/global';
import Loading from '../pages/Loading';

export type TVerifyEmailProps = RouteComponentProps<{ token: string }> & {
	authenticated: boolean;
	loggingIn: boolean;
};

const VerifyEmail: FC<TVerifyEmailProps> = ({
	authenticated,
	history,
	loggingIn,
	match,
}): JSX.Element => {
	if (authenticated) {
		history.replace('/');
	} else if (!loggingIn) {
		Accounts.verifyEmail(
			match.params.token,
			(err: TError): void => {
				if (err) {
					handleError(err);
				} else {
					Bert.alert({
						icon: 'fa fa-check',
						message: 'Your email is now verified!',
						type: 'success',
					});
					history.replace('/users/create');
				}
			},
		);
	}

	return <Loading />;
};

VerifyEmail.whyDidYouRender = true;

export default withRouter(VerifyEmail);
