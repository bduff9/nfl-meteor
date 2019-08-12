import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Bert } from 'meteor/themeteorchef:bert';
import React, { FC, useState } from 'react';
import Helmet from 'react-helmet';
import Isvg from 'react-inlinesvg';
import sweetAlert from 'sweetalert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { getSystemValues } from '../../api/collections/systemvals';
import { handleError } from '../../api/global';
import LoginForm from '../components/LoginForm';

export type TLoginLoading = 'facebook' | 'google' | 'verify' | null;
export type TLoginType = 'login' | 'register';

const Login: FC<{}> = (): JSX.Element => {
	const systemVals = getSystemValues.call({});

	const { year_updated: currYear } = systemVals;
	const [loading, setLoading] = useState<TLoginLoading>(null);
	const [type, setType] = useState<TLoginType>('login');

	const _forgotPassword = (email: string): false => {
		if (!email) {
			sweetAlert({
				title: 'Email not found',
				text: 'Please enter the email address you signed up with',
				icon: 'warning',
			});
		}

		Accounts.forgotPassword(
			{ email },
			(err: Error | Meteor.Error | Meteor.TypedError | undefined): void => {
				if (err) {
					handleError(err);
				} else {
					sweetAlert({
						title: 'Password reset email has been sent',
						icon: 'success',
					});
				}
			},
		);

		return false;
	};

	const _oauthLogin = (
		service: 'loginWithFacebook' | 'loginWithGoogle',
	): void => {
		const options = {
			requestPermissions: ['email'],
		};
		const serviceName = service.replace('loginWith', '').toLowerCase();

		// @ts-ignore
		setLoading(serviceName);
		// @ts-ignore
		Meteor[service](
			options,
			(err: Error | Meteor.Error | Meteor.TypedError | undefined): void => {
				if (err) {
					setLoading(null);
					handleError(err, { title: err.message, icon: 'danger' });
				} else {
					Bert.alert({
						message: 'Welcome!',
						type: 'success',
						icon: 'fa-thumbs-up',
					});
				}
			},
		);
	};

	const _toggleType = (): void => {
		setType(type === 'login' ? 'register' : 'login');
	};

	return (
		<div className="col login-stretch">
			<Helmet title="Login" />
			<div className="signin-form col-12 col-sm-10 col-md-6 col-lg-4">
				<div className="row ball-logo-parent">
					<div className="ball-logo">
						<Isvg src="/svg/football.svg" />
					</div>
				</div>
				<div className="row">
					<div className="login-title text-center">
						<h2>{`${currYear} NFL Confidence Pool`}</h2>
						<h4>{type === 'login' ? 'Login' : 'Registration'}</h4>
					</div>
				</div>
				<div className="login-form">
					<LoginForm
						loading={loading}
						type={type}
						forgotPassword={_forgotPassword}
						setLoading={setLoading}
					/>
				</div>
				<div className="reg-btns">
					<br />
					<div className="row">
						<div className="col-12 bottom-text text-center">
							Or Quickly {type === 'login' ? 'Login With' : 'Register With'}:
						</div>
					</div>
					<div className="row">
						<div className="col-12 col-md-6">
							<button
								type="button"
								className="btn text-center btn-block btn-social btn-facebook"
								disabled={!!loading}
								onClick={(): void => _oauthLogin('loginWithFacebook')}
							>
								<FontAwesomeIcon icon={['fab', 'facebook']} />
								{loading === 'facebook' && (
									<FontAwesomeIcon icon="spinner" fixedWidth pulse />
								)}
							</button>
						</div>
						<div className="col-12 col-md-6">
							<button
								type="button"
								className="btn text-center btn-block btn-social btn-google"
								disabled={!!loading}
								onClick={(): void => _oauthLogin('loginWithGoogle')}
							>
								<FontAwesomeIcon icon={['fab', 'google']} />
								{loading === 'google' && (
									<FontAwesomeIcon icon="spinner" fixedWidth pulse />
								)}
							</button>
						</div>
					</div>
				</div>
				<div className="bottom-wrapper">
					<div className="row">
						<div className="col-12 bottom-text text-center">
							{type === 'login'
								? "Haven't Registered Yet?"
								: 'Already Registered?'}
						</div>
					</div>
					<div className="row">
						<div className="col-12">
							<button
								type="button"
								className="btn btn-block btn-secondary reg-switch-button"
								onClick={_toggleType}
							>
								{type === 'login' ? 'Register Here' : 'Back To Login'}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Login;
