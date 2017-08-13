'use strict';

import React, { Component, PropTypes } from 'react';
import { Bert } from 'meteor/themeteorchef:bert';
import { Formik } from 'formik';
import Yup from 'yup';

import { ACCOUNT_TYPES, AUTO_PICK_TYPES, DEFAULT_LEAGUE, DIGITAL_ACCOUNTS } from '../../api/constants';
import { displayError, getInputColor } from '../../api/global';
import Tooltip from './Tooltip';
import { updateNotifications, updateUser, validateReferredBy } from '../../api/collections/users';

class EditProfileForm extends Component {
	constructor (props) {
		const { values } = props;
		super();
		this.state = {
			showAccountInput: DIGITAL_ACCOUNTS.indexOf(values.payment_type) > -1,
			showQuickPick: values.do_quick_pick,
			showReminder: values.do_reminder
		};
		this._toggleAccountInput = this._toggleAccountInput.bind(this);
		this._toggleQuickPick = this._toggleQuickPick.bind(this);
		this._toggleReminder = this._toggleReminder.bind(this);
	}

	_getHourOptions (max) {
		const opts = [];
		for (let i = 1; i <= max; i++) {
			opts.push(
				<option value={i} key={`${i}-hours-before-first-game-of-max-${max}`}>{i}</option>
			);
		}
		return opts;
	}
	_toggleAccountInput (ev) {
		const { handleChange } = this.props,
				accountType = ev.target.value;
		this.setState({ showAccountInput: (DIGITAL_ACCOUNTS.indexOf(accountType) > -1) });
		handleChange(ev);
	}
	_toggleQuickPick (ev) {
		const { handleChange } = this.props,
				showQuickPick = ev.target.checked;
		this.setState({ showQuickPick });
		handleChange(ev);
	}
	_toggleReminder (ev) {
		const { handleChange } = this.props,
				showReminder = ev.target.checked;
		this.setState({ showReminder });
		handleChange(ev);
	}

	render () {
		const { errors, hasFacebook, hasGoogle, isCreate, isSubmitting, touched, user, values, handleBlur, handleChange, handleSubmit, linkFacebook, linkGoogle } = this.props,
				{ showAccountInput, showQuickPick, showReminder } = this.state;
		return (
			<form onSubmit={handleSubmit}>
				<div className="row form-group">
					<label htmlFor="first_name" className="col-xs-12 col-md-2 col-form-label">Full Name</label>
					<div className={`col-xs-12 col-md-5 ${getInputColor(errors.first_name, touched.first_name, 'has-')}`}>
						<input type="text" className={`form-control ${getInputColor(errors.first_name, touched.first_name, 'form-control-')}`} name="first_name" placeholder="First Name" value={values.first_name} required autoFocus={!values.first_name} onBlur={handleBlur} onChange={handleChange} />
						{errors.first_name && touched.first_name && <div className="form-control-feedback">{errors.first_name}</div>}
					</div>
					<div className={`col-xs-12 col-md-5 ${getInputColor(errors.last_name, touched.last_name, 'has-')}`}>
						<input type="text" className={`form-control ${getInputColor(errors.last_name, touched.last_name, 'form-control-')}`} name="last_name" placeholder="Last Name" value={values.last_name} required onBlur={handleBlur} onChange={handleChange} />
						{errors.last_name && touched.last_name && <div className="form-control-feedback">{errors.last_name}</div>}
					</div>
				</div>
				<div className={`row form-group ${getInputColor(errors.team_name, touched.team_name, 'has-')}`}>
					<label htmlFor="team_name" className="col-xs-12 col-md-2 col-form-label">Team Name (Optional)</label>
					<div className="col-xs-12 col-md-10">
						<input type="text" className={`form-control ${getInputColor(errors.team_name, touched.team_name, 'form-control-')}`} name="team_name" placeholder="Team Name (Optional)" value={values.team_name} onBlur={handleBlur} onChange={handleChange} />
						{errors.team_name && touched.team_name && <div className="form-control-feedback">{errors.team_name}</div>}
					</div>
				</div>
				<div className="row form-group">
					<label className="col-xs-12 col-md-2 col-form-label">Email</label>
					<div className="col-xs-12 col-md-10">
						<p className="form-control-static">{values.email}</p>
					</div>
				</div>
				<div className={`row form-group ${getInputColor(errors.phone_number, touched.phone_number, 'has-')}`}>
					<label htmlFor="phone_number" className="col-xs-12 col-md-2 col-form-label">Phone # (Optional) <Tooltip message="If you would like to receive text reminders, please enter your SMS-capable phone number in the format 1234567980" /></label>
					<div className="col-xs-12 col-md-10">
						<input type="tel" className={`form-control ${getInputColor(errors.phone_number, touched.phone_number, 'form-control-')}`} name="phone_number" placeholder="Phone # (Optional)" value={values.phone_number} onBlur={handleBlur} onChange={handleChange} />
						{errors.phone_number && touched.phone_number && <div className="form-control-feedback">{errors.phone_number}</div>}
					</div>
				</div>
				{isCreate ? (
					<div className={`row form-group ${getInputColor(errors.survivor, touched.survivor, 'has-')}`}>
						<label htmlFor="survivor" className="col-xs-12 col-md-2 col-form-label">Play Survivor Pool?</label>
						<div className="col-xs-12 col-md-10">
							<label className="form-check-label col-form-label">
								<input type="checkbox" className="form-check-input" name="survivor" value="true" checked={values.survivor} onChange={handleChange} />
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
					<div className={`col-xs-12 col-md-5 ${getInputColor(errors.payment_type, touched.payment_type, 'has-')}`}>
						<select className={`form-control ${getInputColor(errors.payment_type, touched.payment_type, 'form-control-')}`} name="payment_type" value={values.payment_type} required onChange={this._toggleAccountInput}>
							<option value="">--Select a Payment Type--</option>
							{ACCOUNT_TYPES.map(type => <option value={type} key={`account_type_${type}`}>{type === 'QuickPay' ? 'Chase QuickPay' : type}</option>)}
						</select>
						{errors.payment_type && touched.payment_type && <div className="form-control-feedback">{errors.payment_type}</div>}
					</div>
					<div className={`col-xs-12 col-md-5 ${getInputColor(errors.payment_account, touched.payment_account, 'has-')}`}>
						{showAccountInput ? (
							<input type="text" className={`form-control ${getInputColor(errors.payment_account, touched.payment_account, 'form-control-')}`} name="payment_account" placeholder="Account for Payments" value={values.payment_account} onBlur={handleBlur} onChange={handleChange} />
						)
							:
							null
						}
						{showAccountInput && errors.payment_account && touched.payment_account && <div className="form-control-feedback">{errors.payment_account}</div>}
					</div>
				</div>
				{isCreate && !user.trusted ? (
					<div className={`row form-group ${getInputColor(errors.referred_by, touched.referred_by, 'has-')}`}>
						<label htmlFor="referred_by" className="col-xs-12 col-md-2 col-form-label">Referred By <Tooltip message="Please enter the exact, full name of the person who referred you in order to gain immediate access" /></label>
						<div className="col-xs-12 col-md-10">
							<input type="text" className={`form-control ${getInputColor(errors.referred_by, touched.referred_by, 'form-control-')}`} name="referred_by" placeholder="Referred By" value={values.referred_by} required onBlur={handleBlur} onChange={handleChange} />
							{errors.referred_by && touched.referred_by && <div className="form-control-feedback">{errors.referred_by}</div>}
						</div>
					</div>
				)
					:
					<input type="hidden" name="referred_by" value={values.referred_by} />
				}
				{!isCreate ? (
					<div className={`row form-group ${getInputColor(errors.auto_pick_strategy, touched.auto_pick_strategy, 'has-')}`}>
						<div className="col-xs-12 text-xs-center h3">
							Auto Picks&nbsp;
							<small className="text-muted">({values.auto_pick_count} left)</small>
						</div>
						<label className="col-xs-12 col-md-2 col-form-label">Auto Pick? <Tooltip message="When you have auto picks left, this will pick a game for you so you don't lose any points when a game starts that you have not picked" /></label>
						<div className="col-xs-12 col-md-10 form-check form-check-inline">
							<label className="form-check-label col-form-label">
								<input className="form-check-input" type="radio" name="auto_pick_strategy" value="" checked={values.auto_pick_strategy === '' || !values.auto_pick_count} onBlur={handleBlur} onChange={handleChange} />
								&nbsp;Off&nbsp; &nbsp;
							</label>
							{!!values.auto_pick_count && AUTO_PICK_TYPES.map(type => (
								<label className="form-check-label col-form-label" key={`auto-pick-strategy-${type}`}>
									<input className="form-check-input" type="radio" name="auto_pick_strategy" value={type} checked={values.auto_pick_strategy === type} onBlur={handleBlur} onChange={handleChange} />
									&nbsp;{`${type} team`}&nbsp; &nbsp;
								</label>
							))}
							{errors.auto_pick_strategy && touched.auto_pick_strategy && <div className="form-control-feedback">{errors.auto_pick_strategy}</div>}
						</div>
					</div>
				)
					:
					null
				}
				{!isCreate ? (
					<div className={`row form-group ${getInputColor(errors.do_reminder, touched.do_reminder, 'has-')}`}>
						<div className="col-xs-12 text-xs-center h3">Notifications</div>
						<label className="col-xs-12 col-md-2 col-form-label">Submit Pick Reminder <Tooltip message="This option allows you to be sent a reminder (email/SMS) when you have not submitted your picks for a week. Note: SMS requires a valid SMS-capable phone number above." /></label>
						<div className="col-xs-12 col-md-10">
							<label className="form-check-label col-form-label">
								<input className="form-check-input" type="checkbox" name="do_reminder" value="true" checked={values.do_reminder} onChange={this._toggleReminder} />
								&nbsp;Yes
							</label>
							{errors.do_reminder && touched.do_reminder && <div className="form-control-feedback">{errors.do_reminder}</div>}
						</div>
					</div>
				)
					:
					null
				}
				{showReminder ? (
					<div className="row form-group">
						<label className="hidden-sm-down col-md-2 col-form-label">&nbsp;</label>
						<div className="col-xs-12 col-md-2">
							<label className="form-check-label col-form-label">
								<input className="form-check-input" type="checkbox" name="reminder_types_email" value="email" checked={values.reminder_types_email} onBlur={handleBlur} onChange={handleChange} />
								&nbsp;Email
							</label>
							{errors.reminder_types_email && touched.reminder_types_email && <div className="form-control-feedback">{errors.reminder_types_email}</div>}
							&nbsp; &nbsp;
							<label className="form-check-label col-form-label">
								<input className="form-check-input" type="checkbox" name="reminder_types_text" value="text" checked={values.reminder_types_text && !errors.phone_number && values.phone_number} disabled={errors.phone_number || !values.phone_number} onBlur={handleBlur} onChange={handleChange} />
								&nbsp;Text
							</label>
							{errors.reminder_types_text && touched.reminder_types_text && <div className="form-control-feedback">{errors.reminder_types_text}</div>}
						</div>
						<label className="col-xs-12 col-md-4 col-form-label text-md-right">Hours before first game:</label>
						<div className={`col-xs-12 col-md-4 ${getInputColor(errors.reminder_hours, true, 'has-')}`}>
							<select className="form-control" name="reminder_hours" value={values.reminder_hours} onBlur={handleBlur} onChange={handleChange}>
								<option value="">--Select Hours Before First Game--</option>
								{this._getHourOptions(72)}
							</select>
							{errors.reminder_hours && <div className="form-control-feedback">{errors.reminder_hours}</div>}
						</div>
					</div>
				)
					:
					null
				}
				{!isCreate ? (
					<div className={`row form-group ${getInputColor(errors.do_quick_pick, touched.do_quick_pick, 'has-')}`}>
						<label className="col-xs-12 col-md-2 col-form-label">Send quick pick email? <Tooltip message="Quick Pick email will let you pick the first game of the week when you have not already made it with one button press" /></label>
						<div className="col-xs-12 col-md-10">
							<label className="form-check-label col-form-label">
								<input className="form-check-input" type="checkbox" name="do_quick_pick" value="true" checked={values.do_quick_pick} onChange={this._toggleQuickPick} />
								&nbsp;Yes
							</label>
							{errors.do_quick_pick && touched.do_quick_pick && <div className="form-control-feedback">{errors.do_quick_pick}</div>}
						</div>
					</div>
				)
					:
					null
				}
				{showQuickPick ? (
					<div className={`row form-group ${getInputColor(errors.quick_pick_hours, true, 'has-')}`}>
						<label className="hidden-sm-down col-md-2 col-form-label">&nbsp;</label>
						<div className="hidden-sm-down col-md-2">&nbsp;</div>
						<label className="col-xs-12 col-md-4 col-form-label text-md-right">Hours before first game:</label>
						<div className="col-xs-12 col-md-4">
							<select className="form-control" name="quick_pick_hours" value={values.quick_pick_hours} onBlur={handleBlur} onChange={handleChange}>
								<option value="">--Select Hours Before First Game--</option>
								{this._getHourOptions(6)}
							</select>
							{errors.quick_pick_hours && <div className="form-control-feedback">{errors.quick_pick_hours}</div>}
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
		values.do_quick_pick = false;
		values.do_reminder = false;
		values.quick_pick_hours = 0;
		values.reminder_hours = 0;
		values.reminder_types_email = false;
		values.reminder_types_text = false;
		if (values.notifications) {
			values.notifications.forEach(notification => {
				if (!notification.is_quick) {
					values.do_reminder = true;
					values.reminder_types_email = notification.type.indexOf('email') > -1;
					values.reminder_types_text = notification.type.indexOf('text') > -1;
					values.reminder_hours = notification.hours_before;
				} else {
					values.do_quick_pick = true;
					values.quick_pick_hours = notification.hours_before;
				}
			});
		}
		return values;
	},

	validationSchema: props => Yup.object().shape({
		first_name: Yup.string().min(2, 'Please enter your first name').required('Please enter your first name'),
		last_name: Yup.string().min(2, 'Please enter your surname').required('Please enter your surname'),
		team_name: Yup.string(),
		referred_by: (props.isCreate ? Yup.string().matches(/\s/, 'Please input the full name of the person that invited you').required('Please input the full name of the person that invited you') : Yup.string()),
		phone_number: Yup.string().matches(/^\d{10}$/, 'Please enter a valid phone number, numbers only'),
		survivor: Yup.string().nullable(true),
		payment_type: Yup.string().oneOf(ACCOUNT_TYPES, 'Please select a valid account type').required('Please select an account type'),
		payment_account: Yup.string().when('payment_type', {
			is: val => DIGITAL_ACCOUNTS.indexOf(val) > -1,
			then: Yup.string().required('Please enter your account name'),
			otherwise: Yup.string()
		}),
		auto_pick_strategy: Yup.string().oneOf(['', ...AUTO_PICK_TYPES], 'Please pick a valid auto pick strategy'),
		do_quick_pick: Yup.boolean(),
		do_reminder: Yup.boolean(),
		quick_pick_hours: Yup.number().when('do_quick_pick', {
			is: true,
			then: Yup.number().min(1, 'Please select between 1 and 6 hours').max(6, 'Please select between 1 and 6 hours').required('You must select how many hours before the first game of the week to send the quick pick email'),
			otherwise: Yup.number()
		}),
		reminder_hours: Yup.number().when('do_reminder', {
			is: true,
			then: Yup.number().min(1, 'Please select between 1 and 72 hours').max(72, 'Please select between 1 and 72 hours').required('You must select how many hours before the first game of the week to be sent a reminder'),
			otherwise: Yup.number()
		}),
		reminder_types_email: Yup.boolean(),
		reminder_types_text: Yup.boolean()
	}),

	handleSubmit: (values, { props, setErrors, setSubmitting }) => {
		const { auto_pick_strategy, do_quick_pick, do_reminder, first_name, survivor, last_name, payment_account, payment_type, phone_number, quick_pick_hours, referred_by, reminder_hours, reminder_types_email, reminder_types_text, team_name } = values,
				{ isCreate, router, user } = props,
				done_registering = user.trusted || validateReferredBy.call({ referred_by });
		try {
			if (isCreate) {
				updateUser.call({ done_registering, first_name, last_name, leagues: [DEFAULT_LEAGUE], payment_account, payment_type, phone_number, referred_by, survivor: survivor || false, team_name });
				if (done_registering) {
					Bert.alert(`Thanks for registering, ${first_name}`, 'success');
					router.push('/users/payments');
				} else {
					Bert.alert(`Thanks for registering, ${first_name}!  An admin will review your application shortly`, 'success');
				}
			} else {
				updateUser.call({ auto_pick_strategy, first_name, last_name, payment_account, payment_type, phone_number, team_name });
				updateNotifications.call({ do_quick_pick, do_reminder, quick_pick_hours: parseInt(quick_pick_hours, 10), reminder_hours: parseInt(reminder_hours, 10), reminder_types_email, reminder_types_text });
				Bert.alert({
					message: 'Profile saved!',
					type: 'success',
					icon: 'fa-save'
				});
				setSubmitting(false);
			}
		} catch(err) {
			console.error('Error on register', err);
			displayError(err);
			setSubmitting(false);
		}
	}
})(EditProfileForm);
