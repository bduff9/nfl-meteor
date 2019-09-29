import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ErrorMessage, Field, Form, FormikProps, withFormik } from 'formik';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Bert } from 'meteor/themeteorchef:bert';
import React, { FC } from 'react';
import sweetAlert from 'sweetalert';
import Yup, { addMethod, string, ref, Schema, ObjectSchema } from 'yup';

import { TError } from '../../api/commonTypes';
import { handleError, getFormControlClass } from '../../api/global';
import { TLoginType, TLoginLoading } from '../pages/Login';

import FormError from './FormError';

export type TLoginFormValues = {
	confirmPassword: string;
	email: string;
	password: string;
};
export type TLoginFormProps = {
	loading: TLoginLoading;
	type: TLoginType;
	forgotPassword: (e: string) => void;
	setLoading: (l: TLoginLoading) => void;
};

const LoginForm: FC<TLoginFormProps & FormikProps<TLoginFormValues>> = ({
	errors,
	isSubmitting,
	loading,
	touched,
	type,
	values,
	forgotPassword,
}): JSX.Element => (
	<Form className="needs-validation" noValidate>
		<div className="form-inputs">
			<Field
				autoComplete="username email"
				className={getFormControlClass(touched.email, errors.email)}
				name="email"
				placeholder="Email"
				type="email"
			/>
			<ErrorMessage component={FormError} name="email" />
			<Field
				autoComplete={type === 'register' ? 'new-password' : 'current-password'}
				className={getFormControlClass(touched.password, errors.password)}
				name="password"
				placeholder="Password"
				type="password"
			/>
			<ErrorMessage component={FormError} name="password" />
			{type === 'register' && (
				<>
					<Field
						autoComplete="new-password"
						className={getFormControlClass(
							touched.confirmPassword,
							errors.confirmPassword,
						)}
						name="confirmPassword"
						placeholder="Confirm Password"
						type="password"
					/>
					<ErrorMessage component={FormError} name="confirmPassword" />
				</>
			)}
		</div>
		<br />
		<div className="row">
			<div className="col-12">
				<button
					type="submit"
					className="btn btn-block btn-success"
					disabled={isSubmitting || loading === 'verify'}
				>
					<strong>
						{type === 'login' ? 'Sign In With Email' : 'Register With Email'}
					</strong>
					{isSubmitting && (
						<FontAwesomeIcon icon={['fad', 'spinner']} fixedWidth pulse />
					)}
				</button>
				<button
					type="button"
					className="btn btn-block btn-info"
					onClick={forgotPassword.bind(null, values.email)}
				>
					Forgot password?
				</button>
				{loading === 'verify' && (
					<div className="text-center text-success">
						<FontAwesomeIcon icon={['fad', 'check']} fixedWidth />{' '}
						<strong>Please check your email to verify your account</strong>
					</div>
				)}
			</div>
		</div>
	</Form>
);

LoginForm.whyDidYouRender = true;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
addMethod(string, 'sameAs', function (ref, message): Schema<any> {
	return this.test('sameAs', message, function (value): boolean {
		const other = this.resolve(ref);

		return !other || !value || value === other;
	});
});

export default withFormik<TLoginFormProps, TLoginFormValues>({
	mapPropsToValues: (): TLoginFormValues => ({
		email: '',
		password: '',
		confirmPassword: '',
	}),

	validationSchema: (props: TLoginFormProps): ObjectSchema =>
		Yup.object().shape({
			email: Yup.string()
				.email('Please enter a valid email')
				.required('Please enter your email address'),
			password: Yup.string()
				.min(6, 'Password must be at least 6 characters')
				.required('Please enter your password'),
			confirmPassword:
				props.type === 'register'
					? Yup.string()
						// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
						// @ts-ignore
						.sameAs(ref('password'), 'Please enter the same password again')
						.required('Please enter your password again')
					: Yup.string(),
		}),

	handleSubmit: (values, { props, setSubmitting }): void => {
		const { type, setLoading } = props;
		const { email, password } = values;

		if (type === 'register') {
			Accounts.createUser(
				{ email, password },
				(err: TError): void => {
					setSubmitting(false);

					// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
					// @ts-ignore
					if (err && err.reason !== 'Login forbidden') {
						// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
						// @ts-ignore
						if (err.error && err.reason) {
							setSubmitting(false);
							handleError(err, {
								// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
								// @ts-ignore
								title: `${err.error}`,
								// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
								// @ts-ignore
								text: err.reason,
								icon: 'warning',
							});
						} else {
							handleError(err);
						}
					} else {
						setLoading('verify');
						sweetAlert({
							title: 'Your account has been created',
							text:
								'Please check your email to verify your account in order to sign in',
							icon: 'success',
						});
					}
				},
			);
		} else {
			Meteor.loginWithPassword(
				email,
				password,
				(err: TError): void => {
					if (err) {
						setSubmitting(false);

						if (
							err instanceof Meteor.Error &&
							err.reason === 'User not found'
						) {
							handleError(err, {
								title: 'User not found!',
								text:
									'Did you mean to register at the bottom of this page instead?',
								icon: 'warning',
							});
						} else {
							handleError(err, { icon: 'warning' });
						}
					} else {
						Bert.alert({
							message: 'Welcome back!',
							type: 'success',
							icon: 'fas fa-thumbs-up',
						});
					}
				},
			);
		}
	},
})(LoginForm);
