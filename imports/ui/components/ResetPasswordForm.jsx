'use strict';

import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import { Accounts } from 'meteor/accounts-base';
import { Bert } from 'meteor/themeteorchef:bert';
import { Formik } from 'formik';
import Yup, { addMethod, string, ref } from 'yup';

import { handleError, getInputColor } from '../../api/global';

const ResetPasswordForm = ({
	dirty,
	errors,
	isSubmitting,
	loading,
	touched,
	values,
	handleBlur,
	handleChange,
	handleReset,
	handleSubmit
}) => (
	<form onSubmit={handleSubmit}>
		<div className={`row form-group ${getInputColor(errors.password, touched.password, 'has-')}`}>
			<label htmlFor="password" className="col-xs-12 col-md-4 col-form-label">New Password</label>
			<div className="col-xs-12 col-md-8">
				<input type="password" id="password" name="password" className={`form-control ${getInputColor(errors.password, touched.password, 'form-control-')}`} placeholder="Password" value={values.password} onChange={handleChange} onBlur={handleBlur} />
				{errors.password && touched.password && <div className="form-control-feedback">{errors.password}</div>}
			</div>
		</div>
		<div className={`row form-group ${getInputColor(errors.confirm_password, touched.confirm_password, 'has-')}`}>
			<label htmlFor="confirm_password" className="col-xs-12 col-md-4 col-form-label">Confirm New Password</label>
			<div className="col-xs-12 col-md-8">
				<input type="password" id="confirm_password" name="confirm_password" className={`form-control ${getInputColor(errors.confirm_password, touched.confirm_password, 'form-control-')}`} placeholder="Confirm Password" value={values.confirm_password} onChange={handleChange} onBlur={handleBlur} />
				{errors.confirm_password && touched.confirm_password && <div className="form-control-feedback">{errors.confirm_password}</div>}
			</div>
		</div>
		<div className="row form-group">
			<label className="col-xs-12 col-md-4 col-form-label">
				<Link to="/"><i className="fa fa-fw fa-angle-double-left"></i> Back to Login</Link>
			</label>
			<div className="col-xs-12 col-md-8 text-xs-center">
				<button type="submit" className="btn btn-block btn-primary" disabled={isSubmitting}>
					<strong>Reset Password</strong>
					{isSubmitting ? <i className="fa fa-fw fa-spinner fa-pulse" /> : null}
				</button>
			</div>
		</div>
	</form>
);

ResetPasswordForm.propTypes = {
	dirty: PropTypes.bool.isRequired,
	error: PropTypes.object,
	errors: PropTypes.object.isRequired,
	isSubmitting: PropTypes.bool.isRequired,
	loading: PropTypes.string,
	touched: PropTypes.object.isRequired,
	values: PropTypes.object.isRequired,
	handleBlur: PropTypes.func.isRequired,
	handleChange: PropTypes.func.isRequired,
	handleReset: PropTypes.func.isRequired,
	handleSubmit: PropTypes.func.isRequired
};

addMethod(string, 'sameAs', function (ref, message) {
	return this.test('sameAs', message, function (value) {
		let other = this.resolve(ref);
		return !other || !value || value === other;
	});
});

export default Formik({

	mapPropsToValues: props => ({
		password: '',
		confirm_password: ''
	}),

	validationSchema: props => Yup.object().shape({
		password: Yup.string().min(6, 'Password must be at least 6 characters').required('Please enter a new password'),
		confirm_password: Yup.string().sameAs(ref('password'), 'Please enter the same password again').required('Please enter your new password again')
	}),

	handleSubmit: (values, { props, setErrors, setSubmitting }) => {
		const { routeParams, router } = props,
				{ token } = routeParams,
				{ password } = values;
		Accounts.resetPassword(token, password, err => {
			if (err) {
				handleError(err);
				setSubmitting(false);
			} else {
				Bert.alert({ type: 'success', message: 'Your password has been successfully reset' });
				router.push('/');
			}
		});
	}
})(ResetPasswordForm);
