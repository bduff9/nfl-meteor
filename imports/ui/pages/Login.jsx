/*jshint esversion: 6 */
'use strict';

import $ from 'jquery';
import 'jquery-validation';
import { Accounts } from 'meteor/accounts-base';
import { Bert } from 'meteor/themeteorchef:bert';
import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { Link } from 'react-router';
import Helmet from 'react-helmet';
import Isvg from 'react-inlinesvg';

import { displayError } from '../../api/global';

export default class Login extends Component {

  constructor(props) {
    super();
    this.state = {
      loading: null,
      type: 'login'
    };
    this._oauthLogin = this._oauthLogin.bind(this);
    this._beginValidating = this._beginValidating.bind(this);
    this._submitEmail = this._submitEmail.bind(this);
    this._toggleType = this._toggleType.bind(this);
  }

  componentDidMount() {
    this._beginValidating();
  }
  _oauthLogin(service, ev) {
    const options = {
          requestPermissions: ['email']
        };
    this.setState({ loading: service });
    Meteor[service](options, (err) => {
      if (err) {
        this.setState({ loading: null });
        displayError(err, { title: err.message, type: 'danger' });
      } else {
        Bert.alert({
          message: 'Welcome!',
          type: 'success',
          icon: 'fa-thumbs-up'
        });
      }
    });
  }
  _emailLogin(ev) {
    ev.preventDefault();
  }
  _beginValidating() {
    const that = this;
    $(this.refs.emailForm).validate({
      submitHandler() {
        that.setState({ loading: 'email' });
        that._submitEmail();
      },
      rules: {
        email: {
          required: true,
          email: true
        },
        password: {
          required: true,
          minlength: 6
        }
      },
      messages: {
        email: 'Please enter a valid email address',
        password: 'Password must be at least six characters'
      }
    });
  }
  _submitEmail() {
    const { type } = this.state,
        email = this.refs.email.value.trim(),
        password = this.refs.password.value.trim();
    if (type === 'register') {
      Accounts.createUser({
        email: email,
        password: password
      }, (err) => {
        if (err && err.reason !== 'Login forbidden') {
          this.setState({ loading: null });
          if (err.error && err.reason) {
            displayError(err, { title: err.error, message: err.reason, type: 'warning' });
          } else {
            displayError(err);
          }
        } else {
          this.setState({ loading: 'verify' });
          Bert.alert({
            message: 'Please check your email to verify your account',
            type: 'success'
          });
        }
      });
    } else {
      Meteor.loginWithPassword(email, password, (err) => {
        if (err) {
          this.setState({ loading: null });
          if (err.reason === 'User not found') {
            displayError(err, { title: 'User not found!  Did you mean to register at the bottom of this page instead?', type: 'warning' });
          } else {
            displayError(err, { title: err.reason, type: 'warning' });
          }
        } else {
          Bert.alert({
            message: 'Welcome!',
            type: 'success',
            icon: 'fa-thumbs-up'
          });
        }
      });
    }
  }
  _toggleType(ev) {
    let { type } = this.state;
    type = (type === 'login' ? 'register' : 'login');
    this.setState({ type });
  }

  render() {
    const { loading, type } = this.state,
        currDate = new Date(),
        currMonth = currDate.getMonth(),
        currYear = currDate.getFullYear() - (currMonth < 2 ? 1 : 0);
    return (
      <div className="row login-stretch">
        <Helmet title="Login" />
        <div className="signin-form col-xs-12 col-sm-10 col-md-6 col-xl-4">
          <div className="row">
            <div className="ball-logo hidden-sm-down">
              <Isvg src="/svg/football.svg" />
            </div>
          </div>
          <div className="row">
            <div className="login-title text-xs-center">
              <h2>{`${currYear} NFL Confidence Pool`}</h2>
              <h4>{type === 'login' ? 'Login' : 'Registration'}</h4>
            </div>
          </div>
          <div className="login-form">
            <form ref="emailForm" id="sign-in-with-email" onSubmit={this._emailLogin}>
              <div className="form-inputs">
                <input ref="email" type="email" name="email" id="email" className="form-control" placeholder="Email" />
                <input ref="password" type="password" name="password" id="password" className="form-control" placeholder="Password" />
              </div>
              <br/>
              <div className="row">
                <div className="col-xs-12">
                  <button type="submit" className="btn btn-block btn-success" disabled={loading}>
                    <strong>{type === 'login' ? 'Sign In With Email' : 'Register With Email'}</strong>
                    {loading === 'email' ? <i className="fa fa-fw fa-spinner fa-pulse" /> : null}
                  </button>
                  {loading === 'verify' ? <div className="text-xs-center text-success"><i className="fa fa-fw fa-check" /> <strong>Please check your email to verify your account</strong></div> : null}
                </div>
              </div>
            </form>
          </div>
          <div className="reg-btns">
            <br />
            <div className="row">
              <div className="col-xs-12 bottom-text text-xs-center">Or Quickly {type === 'login' ? 'Login With' : 'Register With'}:</div>
            </div>
            <div className="row">
              <div className="col-xs-12 col-md-6">
                <button type="button" className="btn text-xs-center btn-block btn-social btn-facebook" disabled={loading} onClick={this._oauthLogin.bind(null, 'loginWithFacebook')}>
                  <i className="fa fa-facebook"></i>
                  {loading === 'facebook' ? <i className="fa fa-fw fa-spinner fa-pulse" /> : null}
                </button>
              </div>
              <div className="col-xs-12 col-md-6">
                <button type="button" className="btn text-xs-center btn-block btn-social btn-google" disabled={loading} onClick={this._oauthLogin.bind(null, 'loginWithGoogle')}>
                  <i className="fa fa-google"></i>
                  {loading === 'google' ? <i className="fa fa-fw fa-spinner fa-pulse" /> : null}
                </button>
              </div>
            </div>
          </div>
          <div className="bottom-wrapper">
            <div className="row">
              <div className="col-xs-12 bottom-text text-xs-center">{type === 'login' ? "Haven't Registered Yet?" : 'Already Registered?'}</div>
            </div>
            <div className="row">
              <div className="col-xs-12">
                <button type="button" className="btn btn-block btn-default" onClick={this._toggleType}>{type === 'login' ? 'Register Here' : 'Back To Login'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
