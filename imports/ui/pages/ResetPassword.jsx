/*jshint esversion: 6 */
'use strict';

import $ from 'jquery';
import 'jquery-validation';
import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { Bert } from 'meteor/themeteorchef:bert';
import Helmet from 'react-helmet';

import { displayError } from '../../api/global';

class ResetPassword extends Component {
  constructor(props) {
    super();
    this.state = {};
    this._beginValidating = this._beginValidating.bind(this);
    this._resetPassword = this._resetPassword.bind(this);
  }

  componentDidMount() {
    this._beginValidating();
  }

  _beginValidating() {
    const that = this;
    $(this.refs.resetForm).validate({
      submitHandler() {
        that._resetPassword();
      },
      rules: {
        password: {
          required: true,
          minlength: 6
        },
        confirm_password: {
          required: true,
          equalTo: '#password'
        }
      },
      messages: {
        password: 'Password must be at least six characters',
        confirm_password: 'Please enter the same password again'
      }
    });
  }
  _resetPassword() {
    const { routeParams } = this.props,
        { token } = routeParams,
        newPassword = this.refs.password.value.trim();
    Accounts.resetPassword(token, newPassword, err => {
      if (err) {
        displayError(err);
      } else {
        Bert.alert({ type: 'success', message: 'Your password has been successfully reset' });
        this.context.router.push('/');
      }
    });
  }
  _submitForm(ev) {
    ev.preventDefault();
    return false;
  }

  render() {
    const { pageReady, users } = this.props;
    return (
      <div className="row reset-password">
        <Helmet title="Reset Password" />
        <div className="col-xs-12">
          <h3 className="title-text text-xs-center text-md-left">Reset Password</h3>
          <form id="reset-password-form" onSubmit={this._submitForm} ref="resetForm">
            <div className="form-inputs">
              <input ref="password" type="password" name="password" id="password" className="form-control" placeholder="Password" />
              <input ref="confirm_password" type="password" name="confirm_password" id="confirm_password" className="form-control" placeholder="Confirm Password" />
              <br />
              <button type="submit" className="btn btn-primary">
                Reset Password
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}

ResetPassword.propTypes = {
  routeParams: PropTypes.object.isRequired
};

ResetPassword.contextTypes = {
  router: PropTypes.object.isRequired
}

export default ResetPassword;
