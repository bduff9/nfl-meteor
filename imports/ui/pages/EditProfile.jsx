'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';
import { Bert } from 'meteor/themeteorchef:bert';
import Helmet from 'react-helmet';

import { handleError } from '../../api/global';
import EditProfileForm from '../components/EditProfileForm';
import { Loading } from './Loading.jsx';

class EditProfile extends Component {
	constructor (props) {
		const user = Meteor.user();
		super();
		this.state = {
			hasFacebook: !!user.services && !!user.services.facebook,
			hasGoogle: !!user.services && !!user.services.google,
			isCreate: props.location.pathname.indexOf('create') > -1,
			user
		};
	}

	_oauthLink (service, ev) {
		const options = {
			requestPermissions: ['email']
		};
		Meteor[service](options, (err) => {
			if (err && err.errorType !== 'Accounts.LoginCancelledError') {
				handleError(err, { title: err.message, type: 'danger' });
			} else {
				if (service.indexOf('Facebook') > -1) {
					this.setState({ hasFacebook: true });
				} else if (service.indexOf('Google') > -1) {
					this.setState({ hasGoogle: true });
				}
				Bert.alert({
					message: 'Successfully linked!',
					type: 'success'
				});
			}
		});
	}

	render () {
		const { hasFacebook, hasGoogle, isCreate, user } = this.state,
				{ pageReady } = this.props,
				{ router } = this.context;
		return (
			<div className="container-fluid edit-profile-wrapper">
				<div className="row">
					{pageReady ? (
						<div className="col-md-11">
							<Helmet title={isCreate ? 'Finish Registration' : 'Edit My Profile'} />
							<div className="row">
								<div className="hidden-md-up">
									<h3 className="title-text text-xs-center text-md-left">{isCreate ? 'Finish Registration' : 'Edit My Profile'}</h3>
								</div>
							</div>
							<div className="edit-profile">
								<EditProfileForm hasFacebook={hasFacebook} hasGoogle={hasGoogle} isCreate={isCreate} router={router} user={user} linkFacebook={this._oauthLink.bind(null, 'loginWithFacebook')} linkGoogle={this._oauthLink.bind(null, 'loginWithGoogle')} />
							</div>
						</div>
					)
						:
						<Loading />
					}
				</div>
			</div>
		);
	}
}

EditProfile.propTypes = {
	location: PropTypes.object.isRequired,
	pageReady: PropTypes.bool.isRequired
};

EditProfile.contextTypes = {
	router: PropTypes.object.isRequired
};

export default createContainer(({ location }) => {
	const usersHandle = Meteor.subscribe('usersForRegistration'),
			usersReady = usersHandle.ready();
	return {
		location,
		pageReady: usersReady
	};
}, EditProfile);
