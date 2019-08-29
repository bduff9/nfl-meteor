import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form, FormikProps, withFormik, Field, ErrorMessage } from 'formik';
import { Accounts } from 'meteor/accounts-base';
import { Bert } from 'meteor/themeteorchef:bert';
import React, { FC } from 'react';
import { NavLink, RouteComponentProps } from 'react-router-dom';
import Yup, { addMethod, string, ref, ObjectSchema } from 'yup';

import { handleError, getFormControlClass } from '../../api/global';

import FormError from './FormError';

export type TResetPasswordFormValues = {
	password: string;
	confirm_password: string;
};
export type TResetPasswordFormProps = {
	history: RouteComponentProps['history'];
	token: string;
};

const ResetPasswordForm: FC<
	TResetPasswordFormProps & FormikProps<TResetPasswordFormValues>
> = ({ errors, isSubmitting, touched }): JSX.Element => (
	<Form className="needs-validation" noValidate>
		<div className="row form-group">
			<label htmlFor="password" className="col-12 col-md-4 col-form-label">
				New Password
			</label>
			<div className="col-12 col-md-8">
				<Field
					className={getFormControlClass(touched.password, errors.password)}
					id="password"
					name="password"
					placeholder="Password"
					type="password"
				/>
				<ErrorMessage component={FormError} name="password" />
			</div>
		</div>
		<div className="row form-group">
			<label
				htmlFor="confirm_password"
				className="col-12 col-md-4 col-form-label"
			>
				Confirm New Password
			</label>
			<div className="col-12 col-md-8">
				<Field
					className={getFormControlClass(
						touched.confirm_password,
						errors.confirm_password,
					)}
					id="confirm_password"
					name="confirm_password"
					placeholder="Confirm Password"
					type="password"
				/>
				<ErrorMessage component={FormError} name="confirm_password" />
			</div>
		</div>
		<div className="row form-group">
			<label className="col-12 col-md-4 col-form-label">
				<NavLink to="/">
					<FontAwesomeIcon icon={['fad', 'angle-double-left']} fixedWidth />{' '}
					Back to Login
				</NavLink>
			</label>
			<div className="col-12 col-md-8 text-center">
				<button
					type="submit"
					className="btn btn-block btn-primary"
					disabled={isSubmitting}
				>
					<strong>Reset Password</strong>
					{isSubmitting && (
						<FontAwesomeIcon icon={['fad', 'spinner']} fixedWidth pulse />
					)}
				</button>
			</div>
		</div>
	</Form>
);

ResetPasswordForm.whyDidYouRender = true;

addMethod(string, 'sameAs', function (ref, message) {
	return this.test('sameAs', message, function (value) {
		const other = this.resolve(ref);

		return !other || !value || value === other;
	});
});

export default withFormik<TResetPasswordFormProps, TResetPasswordFormValues>({
	mapPropsToValues: (): TResetPasswordFormValues => ({
		password: '',
		// eslint-disable-next-line @typescript-eslint/camelcase
		confirm_password: '',
	}),

	validationSchema: (): ObjectSchema =>
		Yup.object().shape({
			password: Yup.string()
				.min(6, 'Password must be at least 6 characters')
				.required('Please enter a new password'),
			// eslint-disable-next-line @typescript-eslint/camelcase
			confirm_password: Yup.string()
				// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
				// @ts-ignore
				.sameAs(ref('password'), 'Please enter the same password again')
				.required('Please enter your new password again'),
		}),

	handleSubmit: (values, { props, setSubmitting }) => {
		const { history, token } = props;
		const { password } = values;

		Accounts.resetPassword(token, password, err => {
			if (err) {
				handleError(err);
				setSubmitting(false);
			} else {
				Bert.alert({
					icon: 'fas fa-check',
					message: 'Your password has been successfully reset',
					type: 'success',
				});
				history.push('/');
			}
		});
	},
})(ResetPasswordForm);
