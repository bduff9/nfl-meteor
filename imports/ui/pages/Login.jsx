'use strict';

import React, { Component } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Bert } from 'meteor/themeteorchef:bert';
import sweetAlert from 'sweetalert';
import Helmet from 'react-helmet';
import Isvg from 'react-inlinesvg';

import { handleError } from '../../api/global';
import LoginForm from '../components/LoginForm';
import { getSystemValues } from '../../api/collections/systemvals';

export default class Login extends Component {

	constructor (props) {
		super();
		this.state = {
			loading: null,
			type: 'login'
		};
		this._oauthLogin = this._oauthLogin.bind(this);
		this._setLoading = this._setLoading.bind(this);
		this._toggleType = this._toggleType.bind(this);
	}

	_forgotPassword (email, ev) {
		if (!email) {
			sweetAlert({
				title: 'Email not found',
				text: 'Please enter the email address you signed up with',
				type: 'warning'
			});
			return false;
		}
		Accounts.forgotPassword({ email }, err => {
			if (err) {
				handleError(err);
			} else {
				sweetAlert({
					title: 'Password reset email has been sent',
					type: 'success'
				});
			}
		});
	}
	_oauthLogin (service, ev) {
		const options = {
			requestPermissions: ['email']
		};
		this.setState({ loading: service });
		Meteor[service](options, (err) => {
			if (err) {
				this.setState({ loading: null });
				handleError(err, { title: err.message, type: 'danger' });
			} else {
				Bert.alert({
					message: 'Welcome!',
					type: 'success',
					icon: 'fa-thumbs-up'
				});
			}
		});
	}
	_setLoading (loading) {
		this.setState({ loading });
	}
	_toggleType (ev) {
		let { type } = this.state;
		type = (type === 'login' ? 'register' : 'login');
		this.setState({ type });
	}

	render () {
		const { loading, type } = this.state,
				systemVals = getSystemValues.call({}),
				currYear = systemVals.year_updated;
		return (
			<div className="col login-stretch">
				<Helmet title="Login" />
				<div className="row">
					<div className="signin-form col-12 col-sm-10 col-md-6 col-lg-4">
						<div className="row ball-logo-parent">
							<div className="col ball-logo">
								<Isvg src="/svg/football.svg" />
							</div>
						</div>
						<div className="row">
							<div className="col login-title text-center">
								<h2>{`${currYear} NFL Confidence Pool`}</h2>
								<h4>{type === 'login' ? 'Login' : 'Registration'}</h4>
							</div>
						</div>
						<div className="row login-form">
							<div className="col">
								<LoginForm loading={loading} type={type} forgotPassword={this._forgotPassword} setLoading={this._setLoading} />
							</div>
						</div>
						<div className="row reg-btns">
							<div className="col-12 bottom-text text-center">&nbsp;<br />Or Quickly {type === 'login' ? 'Login With' : 'Register With'}:</div>
							<div className="col-12 col-md-6">
								<button type="button" className="btn text-center btn-block btn-social btn-facebook" disabled={loading} onClick={this._oauthLogin.bind(null, 'loginWithFacebook')}>
									<i className="fa fa-facebook"></i>
									{loading === 'facebook' ? <i className="fa fa-fw fa-spinner fa-pulse" /> : null}
								</button>
							</div>
							<div className="col-12 col-md-6">
								<button type="button" className="btn text-center btn-block btn-social btn-google" disabled={loading} onClick={this._oauthLogin.bind(null, 'loginWithGoogle')}>
									<i className="fa fa-google"></i>
									{loading === 'google' ? <i className="fa fa-fw fa-spinner fa-pulse" /> : null}
								</button>
							</div>
						</div>
						<div className="row bottom-wrapper">
							<div className="col-12 bottom-text text-center">{type === 'login' ? 'Haven\'t Registered Yet?' : 'Already Registered?'}</div>
							<div className="col-12">
								<button type="button" className="btn btn-block btn-default reg-switch-button" onClick={this._toggleType}>{type === 'login' ? 'Register Here' : 'Back To Login'}</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}
