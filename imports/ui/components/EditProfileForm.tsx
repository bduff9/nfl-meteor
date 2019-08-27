import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ErrorMessage, Field, Form, FormikProps, withFormik } from 'formik';
import { Bert } from 'meteor/themeteorchef:bert';
import React, { FC, useState, FormEvent } from 'react';
import { RouteComponentProps } from 'react-router';
import sweetAlert from 'sweetalert';
import Yup, { ObjectSchema } from 'yup';

import {
	notifyAdminsOfUntrusted,
	TNotification,
	TUser,
	updateNotifications,
	updateUser,
	validateReferredBy,
} from '../../api/collections/users';
import { TPaymentType, TAutoPickStrategy } from '../../api/commonTypes';
import {
	ACCOUNT_TYPES,
	AUTO_PICK_TYPES,
	DEFAULT_LEAGUE,
	DIGITAL_ACCOUNTS,
} from '../../api/constants';
import { handleError, getFormControlClass } from '../../api/global';

import FormError from './FormError';
import Tooltip from './Tooltip';

type TEditProfileFormProps = RouteComponentProps & {
	hasFacebook: boolean;
	hasGoogle: boolean;
	isCreate: boolean;
	user: TUser;
	linkFacebook: () => void;
	linkGoogle: () => void;
};
type TEditProfileFormValues = {
	first_name: string;
	last_name: string;
	email: string;
	team_name: string;
	referred_by: string;
	phone_number: string;
	payment_type: TPaymentType;
	payment_account: string;
	auto_pick_strategy: TAutoPickStrategy;
	auto_pick_count: number;
	notifications: TNotification[];
	do_quick_pick?: boolean;
	do_reminder?: boolean;
	quick_pick_hours?: number;
	reminder_hours?: number;
	reminder_types_email?: boolean;
	reminder_types_text?: boolean;
};

const EditProfileForm: FC<
	TEditProfileFormProps & FormikProps<TEditProfileFormValues>
> = ({
	errors,
	handleChange,
	hasFacebook,
	hasGoogle,
	isCreate,
	isSubmitting,
	linkFacebook,
	linkGoogle,
	setFieldValue,
	setTouched,
	touched,
	user,
	values,
}): JSX.Element => {
	const [showAccountInput, setShowAccountInput] = useState<boolean>(
		(DIGITAL_ACCOUNTS as string[]).indexOf(values.payment_type) > -1,
	);
	const [showQuickPick, setShowQuickPick] = useState<boolean>(
		values.do_quick_pick || false,
	);
	const [showReminder, setShowReminder] = useState<boolean>(
		values.do_reminder || false,
	);

	const _getAccountPlaceholder = (accountType: TPaymentType): string => {
		switch (accountType) {
			case 'PayPal':
			case 'Zelle':
				return 'Email Address for ' + accountType;
			case 'Venmo':
				return 'User ID for ' + accountType;
			default:
				console.error('Invalid account type passed', accountType);

				return 'ERROR';
		}
	};

	const _getHourOptions = (max: number): JSX.Element[] => {
		const opts = [];

		for (let i = 1; i <= max; i++) {
			opts.push(
				<option value={i} key={`${i}-hours-before-first-game-of-max-${max}`}>
					{i}
				</option>,
			);
		}

		return opts;
	};

	const _toggleAccountInput = (ev: FormEvent<HTMLSelectElement>): void => {
		const accountType = ev.currentTarget.value;
		const showAccountInput =
			(DIGITAL_ACCOUNTS as string[]).indexOf(accountType) > -1;

		if (!showAccountInput && accountType) {
			sweetAlert({
				title: 'IMPORTANT: You have chosen cash.',
				text:
					"Checks are not an option so it is your responsibility to submit/receive all cash.\n\nBy pressing 'OK', you acknowledge this, otherwise choose an electronic payment type.",
				icon: 'warning',
			});

			setFieldValue('payment_account', '', true);
		}

		setShowAccountInput(showAccountInput);
		// eslint-disable-next-line @typescript-eslint/camelcase
		setTouched({ payment_type: true });
		handleChange(ev);
	};

	const _toggleQuickPick = (ev: FormEvent<HTMLInputElement>): void => {
		const showQuickPick = ev.currentTarget.checked;

		setShowQuickPick(showQuickPick);

		handleChange(ev);
	};

	const _toggleReminder = (ev: FormEvent<HTMLInputElement>): void => {
		const showReminder = ev.currentTarget.checked;

		setShowReminder(showReminder);

		handleChange(ev);
	};

	return (
		<Form className="needs-validation" noValidate>
			<div className="row form-group">
				<label htmlFor="first_name" className="col-12 col-md-2 col-form-label">
					Full Name
				</label>
				<div className="col-12 col-md-5">
					<Field
						type="text"
						className={getFormControlClass(
							touched.first_name,
							errors.first_name,
						)}
						name="first_name"
						placeholder="First Name"
						required
						autoFocus={!values.first_name}
					/>
					<ErrorMessage component={FormError} name="first_name" />
				</div>
				<div className="col-12 col-md-5">
					<Field
						type="text"
						className={getFormControlClass(touched.last_name, errors.last_name)}
						name="last_name"
						placeholder="Last Name"
						required
					/>
					<ErrorMessage component={FormError} name="last_name" />
				</div>
			</div>
			<div className="row form-group">
				<label htmlFor="team_name" className="col-12 col-md-2 col-form-label">
					Team Name (Optional)
				</label>
				<div className="col-12 col-md-10">
					<Field
						type="text"
						className={getFormControlClass(touched.team_name, errors.team_name)}
						name="team_name"
						placeholder="Team Name (Optional)"
					/>
					<ErrorMessage component={FormError} name="team_name" />
				</div>
			</div>
			<div className="row form-group">
				<label className="col-12 col-md-2 col-form-label">Email</label>
				<div className="col-12 col-md-10">
					<p className="form-control-static">{values.email}</p>
				</div>
			</div>
			<div className="row form-group">
				<label
					htmlFor="phone_number"
					className="col-12 col-md-2 col-form-label"
				>
					Phone # (Optional){' '}
					<Tooltip message="If you would like to receive text reminders, please enter your SMS-capable phone number in the format 1234567980" />
				</label>
				<div className="col-12 col-md-10">
					<Field
						type="tel"
						className={getFormControlClass(
							touched.phone_number,
							errors.phone_number,
						)}
						name="phone_number"
						placeholder="Phone # (Optional)"
					/>
					<ErrorMessage component={FormError} name="phone_number" />
				</div>
			</div>
			<div className="row form-group">
				<label
					htmlFor="payment_type"
					className="col-12 col-md-2 col-form-label"
				>
					Payments (To/From)
				</label>
				<div className="col-12 col-md-5">
					<Field
						component="select"
						className={getFormControlClass(
							touched.payment_type,
							errors.payment_type,
						)}
						name="payment_type"
						required
						onChange={_toggleAccountInput}
					>
						<option value="">--Select a Payment Type--</option>
						{ACCOUNT_TYPES.map(
							(type): JSX.Element => (
								<option value={type} key={`account_type_${type}`}>
									{type}
								</option>
							),
						)}
					</Field>
					<ErrorMessage component={FormError} name="payment_type" />
				</div>
				<div className="col-12 col-md-5">
					{showAccountInput && (
						<Field
							type="text"
							className={getFormControlClass(
								touched.payment_account,
								errors.payment_account,
							)}
							name="payment_account"
							placeholder={_getAccountPlaceholder(values.payment_type)}
						/>
					)}
					{showAccountInput && (
						<ErrorMessage component={FormError} name="payment_account" />
					)}
				</div>
			</div>
			{isCreate && !user.trusted ? (
				<div className="row form-group">
					<label
						htmlFor="referred_by"
						className="col-12 col-md-2 col-form-label"
					>
						Referred By{' '}
						<Tooltip message="Please enter the exact, full name of the person who referred you in order to gain immediate access" />
					</label>
					<div className="col-12 col-md-10">
						<Field
							type="text"
							className={getFormControlClass(
								touched.referred_by,
								errors.referred_by,
							)}
							name="referred_by"
							placeholder="Referred By"
							required
						/>
						<ErrorMessage component={FormError} name="referred_by" />
					</div>
				</div>
			) : (
				<input type="hidden" name="referred_by" value={values.referred_by} />
			)}
			{!isCreate && (
				<div className="row form-group">
					<div className="col-12 text-center h3">
						Auto Picks&nbsp;
						<small className="text-muted">
							({values.auto_pick_count} left)
						</small>
					</div>
					<label className="col-12 col-md-2 col-form-label">
						Auto Pick?{' '}
						<Tooltip message="When you have auto picks left, this will pick a game for you so you don't lose any points when a game starts that you have not picked" />
					</label>
					<div className="col-12 col-md-9 form-check form-check-inline flex-wrap">
						<label className="form-check-label col-form-label text-nowrap col-12 col-md-2">
							<Field
								className={getFormControlClass(
									touched.auto_pick_strategy,
									errors.auto_pick_strategy,
									'form-check-input',
								)}
								type="radio"
								name="auto_pick_strategy"
								value=""
								checked={!values.auto_pick_strategy}
							/>
							&nbsp;Off&nbsp; &nbsp;
						</label>
						{!!values.auto_pick_count &&
							AUTO_PICK_TYPES.map(
								(type): JSX.Element => (
									<label
										className="form-check-label col-form-label text-nowrap col-12 col-md-2"
										key={`auto-pick-strategy-${type}`}
									>
										<Field
											className={getFormControlClass(
												touched.auto_pick_strategy,
												errors.auto_pick_strategy,
												'form-check-input',
											)}
											type="radio"
											name="auto_pick_strategy"
											value={type}
											checked={values.auto_pick_strategy === type}
										/>
										&nbsp;{`${type} team`}&nbsp; &nbsp;
									</label>
								),
							)}
						<ErrorMessage component={FormError} name="auto_pick_strategy" />
					</div>
				</div>
			)}
			{!isCreate && (
				<div className="row form-group">
					<div className="col-12 text-center h3">Notifications</div>
					<label className="col-12 col-md-2 col-form-label">
						Submit Pick Reminder{' '}
						<Tooltip message="This option allows you to be sent a reminder (email/SMS) when you have not submitted your picks for a week. Note: SMS requires a valid SMS-capable phone number above." />
					</label>
					<div className="col-12 col-md-9 form-check form-check-inline">
						<label className="form-check-label col-form-label">
							<Field
								className={getFormControlClass(
									touched.do_reminder,
									errors.do_reminder,
									'form-check-input',
								)}
								type="checkbox"
								name="do_reminder"
								value="true"
								checked={values.do_reminder}
								onChange={_toggleReminder}
							/>
							&nbsp;Yes
						</label>
						<ErrorMessage component={FormError} name="do_reminder" />
					</div>
				</div>
			)}
			{!isCreate && showReminder && (
				<div className="row form-group">
					<label className="d-none d-md-inline-block col-md-2 col-form-label">
						&nbsp;
					</label>
					<div className="col-12 col-md-2 form-check form-check-inline">
						<label className="form-check-label col-form-label">
							<Field
								className={getFormControlClass(
									touched.reminder_types_email,
									errors.reminder_types_email,
									'form-check-input',
								)}
								type="checkbox"
								name="reminder_types_email"
								value="email"
								checked={values.reminder_types_email}
							/>
							&nbsp;Email
						</label>
						<ErrorMessage component={FormError} name="reminder_types_email" />
						&nbsp; &nbsp;
						<label className="form-check-label col-form-label">
							<Field
								className={getFormControlClass(
									touched.reminder_types_text,
									errors.reminder_types_text,
									'form-check-input',
								)}
								type="checkbox"
								name="reminder_types_text"
								disabled={!!errors.phone_number || !values.phone_number}
								value="text"
								checked={values.reminder_types_text}
							/>
							&nbsp;Text
						</label>
						<ErrorMessage component={FormError} name="reminder_types_text" />
					</div>
					<label className="col-12 col-md-3 col-form-label text-md-right">
						Hours before first game:
					</label>
					<div className="col-12 col-md-4">
						<Field
							component="select"
							className={getFormControlClass(
								touched.reminder_hours,
								errors.reminder_hours,
							)}
							name="reminder_hours"
						>
							<option value="">--Select Hours Before First Game--</option>
							{_getHourOptions(72)}
						</Field>
						<ErrorMessage component={FormError} name="reminder_hours" />
					</div>
				</div>
			)}
			{!isCreate && (
				<div className="row form-group">
					<label className="col-12 col-md-2 col-form-label">
						Send quick pick email?{' '}
						<Tooltip message="Quick Pick email will let you pick the first game of the week when you have not already made it with one button press" />
					</label>
					<div className="col-12 col-md-9 form-check form-check-inline">
						<label className="form-check-label col-form-label">
							<Field
								className={getFormControlClass(
									touched.do_quick_pick,
									errors.do_quick_pick,
									'form-check-input',
								)}
								type="checkbox"
								name="do_quick_pick"
								value="true"
								checked={values.do_quick_pick}
								onChange={_toggleQuickPick}
							/>
							&nbsp;Yes
						</label>
						<ErrorMessage component={FormError} name="do_quick_pick" />
					</div>
				</div>
			)}
			{!isCreate && showQuickPick && (
				<div className="row form-group">
					<label className="d-none d-md-inline-block col-md-2 col-form-label">
						&nbsp;
					</label>
					<div className="d-none d-md-inline-block col-md-2">&nbsp;</div>
					<label className="col-12 col-md-3 col-form-label text-md-right">
						Hours before first game:
					</label>
					<div className="col-12 col-md-4">
						<Field
							component="select"
							className={getFormControlClass(
								touched.quick_pick_hours,
								errors.quick_pick_hours,
							)}
							name="quick_pick_hours"
						>
							<option value="">--Select Hours Before First Game--</option>
							{_getHourOptions(6)}
						</Field>
						<ErrorMessage component={FormError} name="quick_pick_hours" />
					</div>
				</div>
			)}
			<div className="row form-group">
				<div className="col-12 col-md-10 offset-md-2 text-left">
					<p className="form-text text-muted">
						<strong>Note:</strong> &nbsp;Linking your account makes logging in
						as simple as a single click
					</p>
				</div>
				<div className="col-12 offset-md-2 col-md-5 text-center social-btns">
					<button
						type="button"
						className="btn btn-primary btn-facebook btn-block"
						disabled={hasFacebook}
						onClick={linkFacebook}
					>
						<FontAwesomeIcon icon={['fab', 'facebook']} />{' '}
						{hasFacebook ? 'Facebook Linked!' : 'Link Facebook'}
					</button>
				</div>
				<div className="col-12 col-md-5 text-center social-btns">
					<button
						type="button"
						className="btn btn-danger btn-google btn-block"
						disabled={hasGoogle}
						onClick={linkGoogle}
					>
						<FontAwesomeIcon icon={['fab', 'google']} />{' '}
						{hasGoogle ? 'Google Linked!' : 'Link Google'}
					</button>
				</div>
			</div>
			<div className="row form-group">
				<div className="col-12">&nbsp;</div>
			</div>
			<div className="row form-group">
				<div className="col-12 text-center">
					<button
						type="submit"
						className="btn btn-primary"
						disabled={isSubmitting || user.trusted === false}
					>
						<FontAwesomeIcon icon={['fad', 'save']} fixedWidth />
						{isCreate ? 'Finish Registration' : 'Save Changes'}
						{isSubmitting && (
							<FontAwesomeIcon icon={['fad', 'spinner']} fixedWidth pulse />
						)}
					</button>
				</div>
			</div>
		</Form>
	);
};

EditProfileForm.whyDidYouRender = true;

export default withFormik<TEditProfileFormProps, TEditProfileFormValues>({
	mapPropsToValues: (props): TEditProfileFormValues => {
		const { ...values } = props.user as TEditProfileFormValues;

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (!values.phone_number) values.phone_number = '';

		// eslint-disable-next-line @typescript-eslint/camelcase
		if (!values.payment_account) values.payment_account = '';

		// eslint-disable-next-line @typescript-eslint/camelcase
		values.do_quick_pick = false;
		// eslint-disable-next-line @typescript-eslint/camelcase
		values.do_reminder = false;
		// eslint-disable-next-line @typescript-eslint/camelcase
		values.quick_pick_hours = 0;
		// eslint-disable-next-line @typescript-eslint/camelcase
		values.reminder_hours = 0;
		// eslint-disable-next-line @typescript-eslint/camelcase
		values.reminder_types_email = false;
		// eslint-disable-next-line @typescript-eslint/camelcase
		values.reminder_types_text = false;

		if (values.notifications) {
			values.notifications.forEach(
				(notification): void => {
					// eslint-disable-next-line @typescript-eslint/camelcase
					if (!notification.is_quick) {
						// eslint-disable-next-line @typescript-eslint/camelcase
						values.do_reminder = true;
						// eslint-disable-next-line @typescript-eslint/camelcase
						values.reminder_types_email =
							notification.type.indexOf('email') > -1;
						// eslint-disable-next-line @typescript-eslint/camelcase
						values.reminder_types_text = notification.type.indexOf('text') > -1;
						// eslint-disable-next-line @typescript-eslint/camelcase
						values.reminder_hours = notification.hours_before;
					} else {
						// eslint-disable-next-line @typescript-eslint/camelcase
						values.do_quick_pick = true;
						// eslint-disable-next-line @typescript-eslint/camelcase
						values.quick_pick_hours = notification.hours_before;
					}
				},
			);
		}

		return values;
	},

	validationSchema: (props: TEditProfileFormProps): ObjectSchema =>
		Yup.object().shape({
			// eslint-disable-next-line @typescript-eslint/camelcase
			first_name: Yup.string()
				.min(2, 'Please enter your first name')
				.required('Please enter your first name'),
			// eslint-disable-next-line @typescript-eslint/camelcase
			last_name: Yup.string()
				.min(2, 'Please enter your surname')
				.required('Please enter your surname'),
			// eslint-disable-next-line @typescript-eslint/camelcase
			team_name: Yup.string(),
			// eslint-disable-next-line @typescript-eslint/camelcase
			referred_by: props.isCreate
				? Yup.string()
					.matches(
						/\s/,
						'Please input the full name of the person that invited you',
					)
					.required('Please input the full name of the person that invited you')
				: Yup.string(),
			// eslint-disable-next-line @typescript-eslint/camelcase
			phone_number: Yup.string().matches(
				/^\d{10}$/,
				'Please enter a valid phone number, numbers only',
			),
			// eslint-disable-next-line @typescript-eslint/camelcase
			payment_type: Yup.string()
				.oneOf(ACCOUNT_TYPES, 'Please select a valid account type')
				.required('Please select an account type'),
			// eslint-disable-next-line @typescript-eslint/camelcase
			payment_account: Yup.string().when('payment_type', {
				is: (val): boolean => DIGITAL_ACCOUNTS.indexOf(val) === -1,
				then: Yup.string().max(0),
				otherwise: Yup.string().when('payment_type', {
					is: 'Venmo',
					then: Yup.string().required('Please enter your Venmo user ID'),
					otherwise: Yup.string()
						.email('Please enter your account email address')
						.required('Please enter your account email address'),
				}),
			}),
			// eslint-disable-next-line @typescript-eslint/camelcase
			auto_pick_strategy: Yup.string().oneOf(
				['', ...AUTO_PICK_TYPES],
				'Please pick a valid auto pick strategy',
			),
			// eslint-disable-next-line @typescript-eslint/camelcase
			do_quick_pick: Yup.boolean(),
			// eslint-disable-next-line @typescript-eslint/camelcase
			do_reminder: Yup.boolean(),
			// eslint-disable-next-line @typescript-eslint/camelcase
			quick_pick_hours: Yup.number().when('do_quick_pick', {
				is: true,
				then: Yup.number()
					.min(1, 'Please select between 1 and 6 hours')
					.max(6, 'Please select between 1 and 6 hours')
					.required(
						'You must select how many hours before the first game of the week to send the quick pick email',
					),
				otherwise: Yup.number(),
			}),
			// eslint-disable-next-line @typescript-eslint/camelcase
			reminder_hours: Yup.number().when('do_reminder', {
				is: true,
				then: Yup.number()
					.min(1, 'Please select between 1 and 72 hours')
					.max(72, 'Please select between 1 and 72 hours')
					.required(
						'You must select how many hours before the first game of the week to be sent a reminder',
					),
				otherwise: Yup.number(),
			}),
			// eslint-disable-next-line @typescript-eslint/camelcase
			reminder_types_email: Yup.boolean(),
			// eslint-disable-next-line @typescript-eslint/camelcase
			reminder_types_text: Yup.boolean(),
		}),

	handleSubmit: (values, { props, setSubmitting }): void => {
		const {
			// eslint-disable-next-line @typescript-eslint/camelcase
			auto_pick_strategy,
			// eslint-disable-next-line @typescript-eslint/camelcase
			do_quick_pick,
			// eslint-disable-next-line @typescript-eslint/camelcase
			do_reminder,
			// eslint-disable-next-line @typescript-eslint/camelcase
			first_name,
			// eslint-disable-next-line @typescript-eslint/camelcase
			last_name,
			// eslint-disable-next-line @typescript-eslint/camelcase
			payment_account,
			// eslint-disable-next-line @typescript-eslint/camelcase
			payment_type,
			// eslint-disable-next-line @typescript-eslint/camelcase
			phone_number,
			// eslint-disable-next-line @typescript-eslint/camelcase
			quick_pick_hours,
			// eslint-disable-next-line @typescript-eslint/camelcase
			referred_by,
			// eslint-disable-next-line @typescript-eslint/camelcase
			reminder_hours,
			// eslint-disable-next-line @typescript-eslint/camelcase
			reminder_types_email,
			// eslint-disable-next-line @typescript-eslint/camelcase
			reminder_types_text,
			// eslint-disable-next-line @typescript-eslint/camelcase
			team_name,
		} = values;
		const { isCreate, history, user } = props;
		// eslint-disable-next-line @typescript-eslint/camelcase
		const done_registering =
			// eslint-disable-next-line @typescript-eslint/camelcase
			user.trusted || validateReferredBy.call({ referred_by });

		try {
			if (isCreate) {
				updateUser.call({
					// eslint-disable-next-line @typescript-eslint/camelcase
					done_registering,
					// eslint-disable-next-line @typescript-eslint/camelcase
					first_name,
					// eslint-disable-next-line @typescript-eslint/camelcase
					last_name,
					leagues: [DEFAULT_LEAGUE],
					// eslint-disable-next-line @typescript-eslint/camelcase
					payment_account,
					// eslint-disable-next-line @typescript-eslint/camelcase
					payment_type,
					// eslint-disable-next-line @typescript-eslint/camelcase
					phone_number,
					// eslint-disable-next-line @typescript-eslint/camelcase
					referred_by,
					survivor: false,
					// eslint-disable-next-line @typescript-eslint/camelcase
					team_name,
				});
				updateNotifications.call({
					// eslint-disable-next-line @typescript-eslint/camelcase
					do_quick_pick: false,
					// eslint-disable-next-line @typescript-eslint/camelcase
					do_reminder: true,
					// eslint-disable-next-line @typescript-eslint/camelcase
					quick_pick_hours: 0,
					// eslint-disable-next-line @typescript-eslint/camelcase
					reminder_hours: 24,
					// eslint-disable-next-line @typescript-eslint/camelcase
					reminder_types_email: true,
					// eslint-disable-next-line @typescript-eslint/camelcase
					reminder_types_text: false,
				});

				// eslint-disable-next-line @typescript-eslint/camelcase
				if (done_registering) {
					Bert.alert({
						icon: 'fa fa-check',
						// eslint-disable-next-line @typescript-eslint/camelcase
						message: `Thanks for registering, ${first_name}`,
						type: 'success',
					});
					history.push('/users/payments');
				} else {
					// eslint-disable-next-line @typescript-eslint/camelcase
					notifyAdminsOfUntrusted.call({ user_id: user._id }, handleError);
					sweetAlert({
						// eslint-disable-next-line @typescript-eslint/camelcase
						title: `Thanks for registering, ${first_name}!`,
						text:
							'An admin will review your application shortly and you will be notified if approved. You may close this window.',
						icon: 'success',
					});
					setSubmitting(false);
				}
			} else {
				updateUser.call({
					// eslint-disable-next-line @typescript-eslint/camelcase
					auto_pick_strategy,
					// eslint-disable-next-line @typescript-eslint/camelcase
					first_name,
					// eslint-disable-next-line @typescript-eslint/camelcase
					last_name,
					// eslint-disable-next-line @typescript-eslint/camelcase
					payment_account,
					// eslint-disable-next-line @typescript-eslint/camelcase
					payment_type,
					// eslint-disable-next-line @typescript-eslint/camelcase
					phone_number,
					// eslint-disable-next-line @typescript-eslint/camelcase
					team_name,
				});
				updateNotifications.call({
					// eslint-disable-next-line @typescript-eslint/camelcase
					do_quick_pick,
					// eslint-disable-next-line @typescript-eslint/camelcase
					do_reminder,
					// eslint-disable-next-line @typescript-eslint/camelcase
					quick_pick_hours: parseInt(`${quick_pick_hours || 0}`, 10),
					// eslint-disable-next-line @typescript-eslint/camelcase
					reminder_hours: parseInt(`${reminder_hours || 0}`, 10),
					// eslint-disable-next-line @typescript-eslint/camelcase
					reminder_types_email,
					// eslint-disable-next-line @typescript-eslint/camelcase
					reminder_types_text,
				});
				sweetAlert({
					title: 'Profile saved!',
					icon: 'success',
				});
				setSubmitting(false);
			}
		} catch (err) {
			console.error('Error on register', err);
			handleError(err);
			setSubmitting(false);
		}
	},
})(EditProfileForm);
