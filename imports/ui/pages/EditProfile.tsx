import { Meteor } from 'meteor/meteor';
import { withTracker } from 'meteor/react-meteor-data';
import { Bert } from 'meteor/themeteorchef:bert';
import React, { FC } from 'react';
import Helmet from 'react-helmet';
import { RouteComponentProps } from 'react-router';

import { TUser } from '../../api/collections/users';
import { TError, TLoginType } from '../../api/commonTypes';
import { handleError } from '../../api/global';
import EditProfileForm from '../components/EditProfileForm';

import Loading from './Loading';

export type TEditProfileProps = RouteComponentProps & {
	pageReady: boolean;
};

const EditProfile: FC<TEditProfileProps> = ({
	pageReady,
	...props
}): JSX.Element => {
	const isCreate = props.location.pathname.indexOf('create') > -1;
	const user = Meteor.user() as TUser;
	const hasFacebook = !!user.services && !!user.services.facebook;
	const hasGoogle = !!user.services && !!user.services.google;
	const hasTwitter = !!user.services && !!user.services.twitter;

	const _oauthLink = (service: TLoginType): void => {
		const options: Meteor.LoginWithExternalServiceOptions = {
			requestPermissions: ['email'],
		};

		Meteor[service](
			options,
			(err?: TError): void => {
				if (
					err instanceof Meteor.TypedError &&
					err.errorType !== 'Accounts.LoginCancelledError'
				) {
					handleError(err, { title: err.message, icon: 'danger' });
				} else {
					Bert.alert({
						icon: 'fas fa-check',
						message: 'Successfully linked!',
						type: 'success',
					});
				}
			},
		);
	};

	return (
		<div className="row edit-profile-wrapper">
			{pageReady ? (
				<div className="col-md-11">
					<Helmet
						title={isCreate ? 'Finish Registration' : 'Edit My Profile'}
					/>
					<div className="d-md-none">
						<h3 className="title-text text-center text-md-left">
							{isCreate ? 'Finish Registration' : 'Edit My Profile'}
						</h3>
					</div>
					<div className="edit-profile">
						<EditProfileForm
							{...props}
							hasFacebook={hasFacebook}
							hasGoogle={hasGoogle}
							hasTwitter={hasTwitter}
							isCreate={isCreate}
							user={user}
							linkFacebook={(): void => _oauthLink('loginWithFacebook')}
							linkGoogle={(): void => _oauthLink('loginWithGoogle')}
							linkTwitter={(): void => _oauthLink('loginWithTwitter')}
						/>
					</div>
				</div>
			) : (
				<Loading />
			)}
		</div>
	);
};

EditProfile.whyDidYouRender = true;

export default withTracker<TEditProfileProps, RouteComponentProps>(
	(props): TEditProfileProps => {
		const usersHandle = Meteor.subscribe('usersForRegistration');
		const usersReady = usersHandle.ready();
		const game1Handle = Meteor.subscribe('nextGame1');
		const game1Ready = game1Handle.ready();

		return {
			...props,
			pageReady: game1Ready && usersReady,
		};
	},
)(EditProfile);
