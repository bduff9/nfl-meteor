'use strict';

import React, { PropTypes } from 'react';
import { Bert } from 'meteor/themeteorchef:bert';
import { Formik } from 'formik';
import Yup from 'yup';

import { displayError } from '../../api/global';
import { updateUser } from '../../api/collections/users';

const _getInputColor = (error, touched, prefix) => {
	if (!touched) return '';
	if (error) return prefix + 'danger';
	return prefix + 'success';
};

const EditProfileForm = ({
	dirty,
	errors,
	hasFacebook,
	hasGoogle,
	isCreate,
	isSubmitting,
	touched,
	values,
	handleBlur,
	handleChange,
	handleReset,
	handleSubmit,
	linkFacebook,
	linkGoogle
}) => (
	<form onSubmit={handleSubmit}>
		<div className="row form-group">
			<label className="col-xs-12 col-md-2 col-form-label">Email</label>
			<div className="col-xs-12 col-md-10">
				<p className="form-control-static">{values.email}</p>
			</div>
		</div>
		<div className="row form-group">
			<label htmlFor="first_name" className="col-xs-12 col-md-2 col-form-label">Full Name</label>
			<div className={`col-xs-12 col-md-5 ${_getInputColor(errors.first_name, touched.first_name, 'has-')}`}>
				<input type="text" className={`form-control ${_getInputColor(errors.first_name, touched.first_name, 'form-control-')}`} name="first_name" placeholder="First Name" value={values.first_name} required onBlur={handleBlur} onChange={handleChange} />
				{errors.first_name && touched.first_name && <div className="form-control-feedback">{errors.first_name}</div>}
			</div>
			<div className={`col-xs-12 col-md-5 ${_getInputColor(errors.last_name, touched.last_name, 'has-')}`}>
				<input type="text" className={`form-control ${_getInputColor(errors.last_name, touched.last_name, 'form-control-')}`} name="last_name" placeholder="Last Name" value={values.last_name} required onBlur={handleBlur} onChange={handleChange} />
				{errors.last_name && touched.last_name && <div className="form-control-feedback">{errors.last_name}</div>}
			</div>
		</div>
		<div className={`row form-group ${_getInputColor(errors.team_name, touched.team_name, 'has-')}`}>
			<label htmlFor="team_name" className="col-xs-12 col-md-2 col-form-label">Team Name (Optional)</label>
			<div className="col-xs-12 col-md-10">
				<input type="text" className={`form-control ${_getInputColor(errors.team_name, touched.team_name, 'form-control-')}`} name="team_name" placeholder="Team Name (Optional)" value={values.team_name} onBlur={handleBlur} onChange={handleChange} />
				{errors.team_name && touched.team_name && <div className="form-control-feedback">{errors.team_name}</div>}
			</div>
		</div>
		<div className={`row form-group ${_getInputColor(errors.referred_by, touched.referred_by, 'has-')}`}>
			<label htmlFor="referred_by" className="col-xs-12 col-md-2 col-form-label">Referred By</label>
			<div className="col-xs-12 col-md-10">
				<input type="text" className={`form-control ${_getInputColor(errors.referred_by, touched.referred_by, 'form-control-')}`} name="referred_by" placeholder="Referred By" value={values.referred_by} onBlur={handleBlur} onChange={handleChange} />
				{errors.referred_by && touched.referred_by && <div className="form-control-feedback">{errors.referred_by}</div>}
			</div>
		</div>
		<div className="row form-group">
			<div className="col-xs-10 offset-xs-1 text-xs-center">
				<p className="form-text text-muted">
					<strong>Note:</strong> &nbsp;Linking your account makes logging in as simple as a single click
				</p>
			</div>
			<div className="col-xs-12 col-md-6 text-xs-center text-md-right social-btns">
				<button type="button" className="btn btn-primary btn-facebook" disabled={hasFacebook} onClick={linkFacebook}>
					<i className="fa fa-facebook"></i> {hasFacebook ? 'Facebook Linked!' : 'Link Facebook'}
				</button>
			</div>
			<div className="col-xs-12 col-md-6 text-xs-center text-md-left social-btns">
				<button type="button" className="btn btn-danger btn-google" disabled={hasGoogle} onClick={linkGoogle}>
					<i className="fa fa-google"></i> {hasGoogle ? 'Google Linked!' : 'Link Google'}
				</button>
			</div>
		</div>
		<div className="row form-group">
			<div className="col-xs-12">&nbsp;</div>
		</div>
		<div className="row form-group">
			<div className="col-xs-12 text-xs-center">
				<button type="submit" className="btn btn-primary" disabled={isSubmitting}>
					<i className="fa fa-fw fa-save"></i>
					{isCreate ? 'Finish Registration' : 'Save Changes'}
					{isSubmitting ? <i className="fa fa-fw fa-spinner fa-pulse" /> : null}
				</button>
			</div>
		</div>
	</form>
);

EditProfileForm.propTypes = {
	dirty: PropTypes.bool.isRequired,
	error: PropTypes.object,
	errors: PropTypes.object.isRequired,
	hasFacebook: PropTypes.bool.isRequired,
	hasGoogle: PropTypes.bool.isRequired,
	isCreate: PropTypes.bool.isRequired,
	isSubmitting: PropTypes.bool.isRequired,
	router: PropTypes.object.isRequired,
	touched: PropTypes.object.isRequired,
	user: PropTypes.object.isRequired,
	values: PropTypes.object.isRequired,
	handleBlur: PropTypes.func.isRequired,
	handleChange: PropTypes.func.isRequired,
	handleReset: PropTypes.func.isRequired,
	handleSubmit: PropTypes.func.isRequired,
	linkFacebook: PropTypes.func.isRequired,
	linkGoogle: PropTypes.func.isRequired
};

export default Formik({

	mapPropsToValues: props => props.user,

	validationSchema: props => Yup.object().shape({
		first_name: Yup.string().min(2, 'Please enter your first name').required('Please enter your first name'),
		last_name: Yup.string().min(2, 'Please enter your surname').required('Please enter your surname'),
		team_name: Yup.string(),
		referred_by: Yup.string().matches(/\s/, 'Please input the full name of the person that invited you').required('Please input the full name of the person that invited you')
	}),

	handleSubmit: (values, { props, setErrors, setSubmitting }) => {
		const { first_name, survivor, last_name, payment_account, payment_type, referred_by, team_name } = values,
				{ isCreate, router } = props,
				done_registering = true;
		try {
			updateUser.call({ done_registering, first_name, last_name, payment_account, payment_type, referred_by, survivor, team_name });
			if (isCreate) {
				Bert.alert(`Thanks for registering, ${first_name}`, 'success');
				router.push('/');
			} else {
				Bert.alert({
					message: 'Profile saved!',
					type: 'success',
					icon: 'fa-save'
				});
			}
		} catch(err) {
			displayError(err);
		}
	}
})(EditProfileForm);
