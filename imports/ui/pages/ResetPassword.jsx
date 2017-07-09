'use strict';

import $ from 'jquery';
import 'jquery-validation';
import React, { Component, PropTypes } from 'react';
import { Accounts } from 'meteor/accounts-base';
import { Bert } from 'meteor/themeteorchef:bert';
import Helmet from 'react-helmet';

import { displayError } from '../../api/global';

class ResetPassword extends Component {
	constructor(props) {
		super();
		this.state = {};
		this._beginValidating = this._beginValidating.bind(this);
		this._resetPassword = this._resetPassword.bind(this);
	}

	componentDidMount() {
		this._beginValidating();
	}

	_beginValidating() {
		const that = this;
		$(this.resetFormRef).validate({
			submitHandler() {
				that._resetPassword();
			},
			rules: {
				password: {
					required: true,
					minlength: 6
				},
				confirm_password: {
					required: true,
					equalTo: '#password'
				}
			},
			messages: {
				password: 'Password must be at least six characters',
				confirm_password: 'Please enter the same password again'
			}
		});
	}
	_resetPassword() {
		const { routeParams } = this.props,
				{ token } = routeParams,
				newPassword = this.passwordRef.value.trim();
		Accounts.resetPassword(token, newPassword, err => {
			if (err) {
				displayError(err);
			} else {
				Bert.alert({ type: 'success', message: 'Your password has been successfully reset' });
				this.context.router.push('/');
			}
		});
	}
	_submitForm(ev) {
		ev.preventDefault();
		return false;
	}

	render() {
		return (
			<div className="container-fluid reset-password">
				<div className="row">
					<Helmet title="Reset Password" />
					<div className="white-box col-xs-11 col-sm-10 col-md-6 col-xl-4">
						<div className="row">
							<h3 className="title-text text-xs-center">Reset Password</h3>
						</div>
						<form id="reset-password-form" onSubmit={this._submitForm} ref={form => { this.resetFormRef = form; }}>
							<div className="form-inputs">
								<div className="row">
									<input ref={input => { this.passwordRef = input; }} type="password" name="password" id="password" className="form-control" placeholder="Password" />
								</div>
								<div className="row">
									<input ref={input => { this.confirmPasswordRef = input; }} type="password" name="confirm_password" id="confirm_password" className="form-control" placeholder="Confirm Password" />
								</div>
								<br />
								<div className="row">
									<div className="col-xs-12 text-xs-center">
										<button type="submit" className="btn btn-primary">
											Reset Password
										</button>
									</div>
								</div>
							</div>
						</form>
					</div>
				</div>
			</div>
		);
	}
}

ResetPassword.propTypes = {
	routeParams: PropTypes.object.isRequired
};

ResetPassword.contextTypes = {
	router: PropTypes.object.isRequired
};

export default ResetPassword;
