'use strict';

import React, { PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Bert } from 'meteor/themeteorchef:bert';
import { Formik } from 'formik';
import Yup, { addMethod, string, ref } from 'yup';

import { displayError } from '../../api/global';

const LoginForm = ({
	dirty,
	errors,
	isSubmitting,
	loading,
	touched,
	type,
	values,
	forgotPassword,
	handleBlur,
	handleChange,
	handleReset,
	handleSubmit
}) => (
	<form onSubmit={handleSubmit}>
		<div className="form-inputs">
			<input type="email" name="email" className="form-control" placeholder="Email" value={values.email} onChange={handleChange} onBlur={handleBlur} />
			{errors.email && touched.email && <div className="text-danger">{errors.email}</div>}
			<input type="password" name="password" className="form-control" placeholder="Password" value={values.password} onChange={handleChange} onBlur={handleBlur} />
			{errors.password && touched.password && <div className="text-danger">{errors.password}</div>}
			{type === 'register' ? <input type="password" name="confirmPassword" className="form-control" placeholder="Confirm Password" value={values.confirmPassword} onChange={handleChange} onBlur={handleBlur} /> : null}
			{errors.confirmPassword && touched.confirmPassword && <div className="text-danger">{errors.confirmPassword}</div>}
		</div>
		<br/>
		<div className="row">
			<div className="col-xs-12">
				<button type="submit" className="btn btn-block btn-success" disabled={isSubmitting || loading === 'verify'}>
					<strong>{type === 'login' ? 'Sign In With Email' : 'Register With Email'}</strong>
					{isSubmitting ? <i className="fa fa-fw fa-spinner fa-pulse" /> : null}
				</button>
				<button type="button" className="btn btn-block btn-info" onClick={forgotPassword.bind(null, values.email)}>
					Forgot password?
				</button>
				{loading === 'verify' ? <div className="text-xs-center text-success"><i className="fa fa-fw fa-check" /> <strong>Please check your email to verify your account</strong></div> : null}
			</div>
		</div>
	</form>
);

LoginForm.propTypes = {
	dirty: PropTypes.bool.isRequired,
	error: PropTypes.object,
	errors: PropTypes.object.isRequired,
	isSubmitting: PropTypes.bool.isRequired,
	loading: PropTypes.string,
	touched: PropTypes.object.isRequired,
	type: PropTypes.oneOf(['login', 'register']).isRequired,
	values: PropTypes.object.isRequired,
	forgotPassword: PropTypes.func.isRequired,
	handleBlur: PropTypes.func.isRequired,
	handleChange: PropTypes.func.isRequired,
	handleReset: PropTypes.func.isRequired,
	handleSubmit: PropTypes.func.isRequired,
	setLoading: PropTypes.func.isRequired
};

addMethod(string, 'sameAs', function (ref, message) {
	return this.test('sameAs', message, function (value) {
		let other = this.resolve(ref);
		return !other || !value || value === other;
	});
});

export default Formik({

	mapPropsToValues: props => ({
		email: '',
		password: '',
		confirmPassword: ''
	}),

	validationSchema: props => Yup.object().shape({
		email: Yup.string().email('Please enter a valid email').required('Please enter your email address'),
		password: Yup.string().min(6, 'Password must be at least 6 characters').required('Please enter your password'),
		confirmPassword: (props.type === 'register' ? Yup.string().sameAs(ref('password'), 'Please enter the same password again').required('Please enter your password again') : Yup.string())
	}),

	handleSubmit: (values, { props, setErrors, setSubmitting }) => {
		const { type, setLoading } = props,
				{ email, password } = values;
		if (type === 'register') {
			Accounts.createUser({ email, password }, err => {
				setSubmitting(false);
				if (err && err.reason !== 'Login forbidden') {
					if (err.error && err.reason) {
						setSubmitting(false);
						displayError(err, { title: err.error, message: err.reason, type: 'warning' });
					} else {
						displayError(err);
					}
				} else {
					setLoading('verify');
					Bert.alert({
						message: 'Please check your email to verify your account',
						type: 'success'
					});
				}
			});
		} else {
			Meteor.loginWithPassword(email, password, err => {
				if (err) {
					setSubmitting(false);
					if (err.reason === 'User not found') {
						displayError(err, { title: 'User not found!  Did you mean to register at the bottom of this page instead?', type: 'warning' });
					} else {
						displayError(err, { title: err.reason, type: 'warning' });
					}
				} else {
					Bert.alert({
						message: 'Welcome!',
						type: 'success',
						icon: 'fa-thumbs-up'
					});
				}
			});
		}
	}
})(LoginForm);
