'use strict';

import React, { PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Bert } from 'meteor/themeteorchef:bert';
import { Formik } from 'formik';
import Yup from 'yup';

import { displayError } from '../../api/global';

const EditProfileForm = ({
	dirty,
	errors,
	isCreate,
	isSubmitting,
	touched,
	values,
	handleBlur,
	handleChange,
	handleReset,
	handleSubmit
}) => (
	<form onSubmit={handleSubmit}>
		<div className="row">
			<div className="col-xs-12 form-group">
				<label>Email</label>
				<p className="form-control-static">{values.email}</p>
			</div>
		</div>
		<div className="row">
			<div className="col-xs-12 col-md-6 form-group">
				<label htmlFor="first_name">First Name</label>
				<input type="text" className="form-control" name="firstName" placeholder="First Name" value={values.firstName} required onBlur={handleBlur} onChange={handleChange} />
				{errors.firstName && touched.firstName && <div className="text-danger">{errors.firstName}</div>}
			</div>
			<div className="col-xs-12 col-md-6 form-group">
				<label htmlFor="last_name">Last Name</label>
				<input type="text" className="form-control" name="lastName" placeholder="Last Name" value={values.lastName} required onBlur={handleBlur} onChange={handleChange} />
			</div>
		</div>
		<div className="row">
			<div className="col-xs-12 form-group">
				<label htmlFor="team_name">Team Name (Optional)</label>
				<input type="text" className="form-control" name="teamName" placeholder="Team Name (Optional)" value={values.teamName} onBlur={handleBlur} onChange={handleChange} />
			</div>
		</div>
		<div className="row">
			<div className="col-xs-12 form-group">
				<label htmlFor="referred_by">Referred By</label>
				<input type="text" className="form-control" name="referredBy" placeholder="Referred By" value={values.referredBy} onBlur={handleBlur} onChange={handleChange} />
			</div>
		</div>
		<div className="row">
			<div className="col-xs-12 form-group text-xs-center save-wrapper">
				<div className="row">
					<div className="social-text col-xs-10 offset-xs-1 text-xs-center">
						<strong>Note:</strong>
					&nbsp;Linking your account makes logging in as simple as a single click
					</div>
				</div>
				<div className="row form-group">
					<div className="col-xs-12 col-md-6 text-xs-center text-md-right social-btns">
						<button type="button" className="btn btn-primary btn-facebook" disabled={hasFacebook} onClick={oauthLink.bind(null, 'loginWithFacebook')}>
							<i className="fa fa-facebook"></i> {hasFacebook ? 'Facebook Linked!' : 'Link Facebook'}
						</button>
					</div>
					<div className="col-xs-12 col-md-6 text-xs-center text-md-left social-btns">
						<button type="button" className="btn btn-danger btn-google" disabled={hasGoogle} onClick={oauthLink.bind(null, 'loginWithGoogle')}>
							<i className="fa fa-google"></i> {hasGoogle ? 'Google Linked!' : 'Link Google'}
						</button>
					</div>
				</div>
				<div className="col-xs-12 save-btn">
					<button type="submit" className="btn btn-primary" disabled={isSubmitting}>
						<i className="fa fa-fw fa-save"></i>
						{isCreate ? 'Finish Registration' : 'Save Changes'}
						{isSubmitting ? <i className="fa fa-fw fa-spinner fa-pulse" /> : null}
					</button>
				</div>
			</div>
		</div>
	</form>
);

EditProfileForm.propTypes = {
	dirty: PropTypes.bool.isRequired,
	error: PropTypes.object,
	errors: PropTypes.object.isRequired,
	isCreate: PropTypes.bool.isRequired,
	isSubmitting: PropTypes.bool.isRequired,
	touched: PropTypes.object.isRequired,
	values: PropTypes.object.isRequired,
	handleBlur: PropTypes.func.isRequired,
	handleChange: PropTypes.func.isRequired,
	handleReset: PropTypes.func.isRequired,
	handleSubmit: PropTypes.func.isRequired
};

export default Formik({

	mapPropsToValues: props => ({
		//TODO:
	}),

	validationSchema: props => Yup.object().shape({
		email: Yup.string().email('Please enter a valid email').required('Please enter your email address')
		//TODO:
	}),

	handleSubmit: (values, { props, setErrors, setSubmitting }) => {
		//TODO:
	}
})(EditProfileForm);
