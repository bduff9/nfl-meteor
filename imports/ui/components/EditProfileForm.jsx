'use strict';

import React, { Component, PropTypes } from 'react';
import { Bert } from 'meteor/themeteorchef:bert';
import { Formik } from 'formik';
import Yup from 'yup';

import { ACCOUNT_TYPES, DEFAULT_LEAGUE, DIGITAL_ACCOUNTS } from '../../api/constants';
import { displayError } from '../../api/global';
import { updateUser, validateReferredBy } from '../../api/collections/users';

class EditProfileForm extends Component {
	constructor (props) {
		super();
		this.state = {
			showAccountInput: DIGITAL_ACCOUNTS.indexOf(props.values.payment_type) > -1
		};
		this._toggleAccountInput = this._toggleAccountInput.bind(this);
	}

	_getInputColor (error, touched, prefix) {
		if (!touched) return '';
		if (error) return prefix + 'danger';
		return prefix + 'success';
	}
	_toggleAccountInput (ev) {
		const { handleChange } = this.props,
				accountType = ev.target.value;
		this.setState({ showAccountInput: (DIGITAL_ACCOUNTS.indexOf(accountType) > -1) });
		handleChange(ev);
	}

	render () {
		const { errors, hasFacebook, hasGoogle, isCreate, isSubmitting, touched, user, values, handleBlur, handleChange, handleSubmit, linkFacebook, linkGoogle } = this.props,
				{ showAccountInput } = this.state;
		return (
			<form onSubmit={handleSubmit}>
				<div className="row form-group">
					<label htmlFor="first_name" className="col-xs-12 col-md-2 col-form-label">Full Name</label>
					<div className={`col-xs-12 col-md-5 ${this._getInputColor(errors.first_name, touched.first_name, 'has-')}`}>
						<input type="text" className={`form-control ${this._getInputColor(errors.first_name, touched.first_name, 'form-control-')}`} name="first_name" placeholder="First Name" value={values.first_name} required autoFocus={!values.first_name} onBlur={handleBlur} onChange={handleChange} />
						{errors.first_name && touched.first_name && <div className="form-control-feedback">{errors.first_name}</div>}
					</div>
					<div className={`col-xs-12 col-md-5 ${this._getInputColor(errors.last_name, touched.last_name, 'has-')}`}>
						<input type="text" className={`form-control ${this._getInputColor(errors.last_name, touched.last_name, 'form-control-')}`} name="last_name" placeholder="Last Name" value={values.last_name} required onBlur={handleBlur} onChange={handleChange} />
						{errors.last_name && touched.last_name && <div className="form-control-feedback">{errors.last_name}</div>}
					</div>
				</div>
				<div className={`row form-group ${this._getInputColor(errors.team_name, touched.team_name, 'has-')}`}>
					<label htmlFor="team_name" className="col-xs-12 col-md-2 col-form-label">Team Name (Optional)</label>
					<div className="col-xs-12 col-md-10">
						<input type="text" className={`form-control ${this._getInputColor(errors.team_name, touched.team_name, 'form-control-')}`} name="team_name" placeholder="Team Name (Optional)" value={values.team_name} onBlur={handleBlur} onChange={handleChange} />
						{errors.team_name && touched.team_name && <div className="form-control-feedback">{errors.team_name}</div>}
					</div>
				</div>
				<div className="row form-group">
					<label className="col-xs-12 col-md-2 col-form-label">Email</label>
					<div className="col-xs-12 col-md-10">
						<p className="form-control-static">{values.email}</p>
					</div>
				</div>
				<div className={`row form-group ${this._getInputColor(errors.phone_number, touched.phone_number, 'has-')}`}>
					<label htmlFor="phone_number" className="col-xs-12 col-md-2 col-form-label">Phone # (Optional)</label>
					<div className="col-xs-12 col-md-10">
						<input type="tel" className={`form-control ${this._getInputColor(errors.phone_number, touched.phone_number, 'form-control-')}`} name="phone_number" placeholder="Phone # (Optional)" value={values.phone_number} onBlur={handleBlur} onChange={handleChange} />
						{errors.phone_number && touched.phone_number && <div className="form-control-feedback">{errors.phone_number}</div>}
					</div>
				</div>
				{isCreate ? (
					<div className={`row form-group ${this._getInputColor(errors.survivor, touched.survivor, 'has-')}`}>
						<label htmlFor="survivor" className="col-xs-12 col-md-2 col-form-label">Play Survivor Pool?</label>
						<div className="col-xs-12 col-md-10">
							<label className="form-check-label col-form-label">
								<input type="checkbox" className="form-check-input" name="survivor" value="Y" checked={values.survivor} onChange={handleChange} />
								&nbsp;Yes
							</label>
							{errors.survivor && touched.survivor && <div className="form-control-feedback">{errors.survivor}</div>}
						</div>
					</div>
				)
					:
					null
				}
				<div className="row form-group">
					<label htmlFor="payment_type" className="col-xs-12 col-md-2 col-form-label">Payments (To/From)</label>
					<div className={`col-xs-12 col-md-5 ${this._getInputColor(errors.payment_type, touched.payment_type, 'has-')}`}>
						<select className={`form-control ${this._getInputColor(errors.payment_type, touched.payment_type, 'form-control-')}`} name="payment_type" value={values.payment_type} required onChange={this._toggleAccountInput}>
							<option value="">--Select a Payment Type--</option>
							{ACCOUNT_TYPES.map(type => <option value={type} key={`account_type_${type}`}>{type === 'QuickPay' ? 'Chase QuickPay' : type}</option>)}
						</select>
						{errors.payment_type && touched.payment_type && <div className="form-control-feedback">{errors.payment_type}</div>}
					</div>
					<div className={`col-xs-12 col-md-5 ${this._getInputColor(errors.payment_account, touched.payment_account, 'has-')}`}>
						{showAccountInput ? (
							<input type="text" className={`form-control ${this._getInputColor(errors.payment_account, touched.payment_account, 'form-control-')}`} name="payment_account" placeholder="Account for Payments" value={values.payment_account} onBlur={handleBlur} onChange={handleChange} />
						)
							:
							null
						}
						{showAccountInput && errors.payment_account && touched.payment_account && <div className="form-control-feedback">{errors.payment_account}</div>}
					</div>
				</div>
				{isCreate && !user.trusted ? (
					<div className={`row form-group ${this._getInputColor(errors.referred_by, touched.referred_by, 'has-')}`}>
						<label htmlFor="referred_by" className="col-xs-12 col-md-2 col-form-label">Referred By</label>
						<div className="col-xs-12 col-md-10">
							<input type="text" className={`form-control ${this._getInputColor(errors.referred_by, touched.referred_by, 'form-control-')}`} name="referred_by" placeholder="Referred By" value={values.referred_by} required onBlur={handleBlur} onChange={handleChange} />
							{errors.referred_by && touched.referred_by && <div className="form-control-feedback">{errors.referred_by}</div>}
						</div>
					</div>
				)
					:
					<input type="hidden" name="referred_by" value={values.referred_by} />
				}
				{!isCreate ? (
					<div className="row form-group">
						<label className="col-xs-12 col-md-2 col-form-label">Notifications</label>
						<div className="col-xs-12 col-md-10">
							<p className="form-control-static">TODO</p>
						</div>
					</div>
				)
					:
					null
				}
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
						<button type="submit" className="btn btn-primary" disabled={isSubmitting || user.trusted === false}>
							<i className="fa fa-fw fa-save"></i>
							{isCreate ? 'Finish Registration' : 'Save Changes'}
							{isSubmitting ? <i className="fa fa-fw fa-spinner fa-pulse" /> : null}
						</button>
					</div>
				</div>
			</form>
		);
	}
}

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

	mapPropsToValues: props => {
		const { ...values } = props.user;
		if (!values.phone_number) values.phone_number = '';
		if (!values.payment_account) values.payment_account = '';
		return values;
	},

	validationSchema: props => Yup.object().shape({
		first_name: Yup.string().min(2, 'Please enter your first name').required('Please enter your first name'),
		last_name: Yup.string().min(2, 'Please enter your surname').required('Please enter your surname'),
		team_name: Yup.string(),
		referred_by: (props.isCreate ? Yup.string().matches(/\s/, 'Please input the full name of the person that invited you').required('Please input the full name of the person that invited you') : Yup.string()),
		phone_number: Yup.string().matches(/^(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?$/, 'Please enter a valid phone number'),
		survivor: Yup.string(),
		payment_type: Yup.string().oneOf(ACCOUNT_TYPES, 'Please select a valid account type').required('Please select an account type'),
		payment_account: Yup.string().when('payment_type', {
			is: val => DIGITAL_ACCOUNTS.indexOf(val) > -1,
			then: Yup.string().required('Please enter your account name'),
			otherwise: Yup.string()
		})
	}),

	handleSubmit: (values, { props, setErrors, setSubmitting }) => {
		const { first_name, survivor, last_name, payment_account, payment_type, phone_number, referred_by, team_name } = values,
				{ isCreate, router, user } = props,
				done_registering = user.trusted || validateReferredBy.call({ referred_by });
		try {
			updateUser.call({ done_registering, first_name, last_name, leagues: [DEFAULT_LEAGUE], payment_account, payment_type, phone_number, referred_by, survivor: (survivor === 'Y'), team_name });
			if (isCreate) {
				if (done_registering) {
					Bert.alert(`Thanks for registering, ${first_name}`, 'success');
					router.push('/users/payments');
				} else {
					Bert.alert(`Thanks for registering, ${first_name}!  An admin will review your application shortly`, 'success');
				}
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
