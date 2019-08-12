import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FormikProps, withFormik } from 'formik';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import { Bert } from 'meteor/themeteorchef:bert';
import React, { FC } from 'react';
import sweetAlert from 'sweetalert';
import Yup, { addMethod, string, ref, Schema, ObjectSchema } from 'yup';

import { handleError } from '../../api/global';
import { TLoginType, TLoginLoading } from '../pages/Login';

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
	handleBlur,
	handleChange,
	handleSubmit,
}): JSX.Element => (
	<form onSubmit={handleSubmit}>
		<div className="form-inputs">
			<input
				type="email"
				name="email"
				className="form-control"
				placeholder="Email"
				value={values.email}
				onChange={handleChange}
				onBlur={handleBlur}
			/>
			{errors.email && touched.email && (
				<div className="text-danger">{errors.email}</div>
			)}
			<input
				type="password"
				name="password"
				className="form-control"
				placeholder="Password"
				value={values.password}
				onChange={handleChange}
				onBlur={handleBlur}
			/>
			{errors.password && touched.password && (
				<div className="text-danger">{errors.password}</div>
			)}
			{type === 'register' ? (
				<input
					type="password"
					name="confirmPassword"
					className="form-control"
					placeholder="Confirm Password"
					value={values.confirmPassword}
					onChange={handleChange}
					onBlur={handleBlur}
				/>
			) : null}
			{errors.confirmPassword && touched.confirmPassword && (
				<div className="text-danger">{errors.confirmPassword}</div>
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
					{isSubmitting && <FontAwesomeIcon icon="spinner" fixedWidth pulse />}
				</button>
				<button
					type="button"
					className="btn btn-block btn-info"
					onClick={forgotPassword.bind(null, values.email)}
				>
					Forgot password?
				</button>
				{loading === 'verify' ? (
					<div className="text-center text-success">
						<FontAwesomeIcon icon="check" fixedWidth />{' '}
						<strong>Please check your email to verify your account</strong>
					</div>
				) : null}
			</div>
		</div>
	</form>
);

addMethod(string, 'sameAs', function (ref, message): Schema<any> {
	return this.test('sameAs', message, function (value): boolean {
		let other = this.resolve(ref);

		return !other || !value || value === other;
	});
});

export default withFormik<TLoginFormProps, TLoginFormValues>({
	mapPropsToValues: (): {
		email: string;
		password: string;
		confirmPassword: string;
	} => ({
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
				(err: Error | Meteor.Error | Meteor.TypedError | undefined): void => {
					setSubmitting(false);

					// @ts-ignore
					if (err && err.reason !== 'Login forbidden') {
						// @ts-ignore
						if (err.error && err.reason) {
							setSubmitting(false);
							handleError(err, {
								// @ts-ignore
								title: `${err.error}`,
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
				(err: Error | Meteor.Error | Meteor.TypedError | undefined): void => {
					if (err) {
						setSubmitting(false);

						// @ts-ignore
						if (err.reason === 'User not found') {
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
							icon: 'fa-thumbs-up',
						});
					}
				},
			);
		}
	},
})(LoginForm);
