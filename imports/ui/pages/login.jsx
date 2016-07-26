/*jshint esversion: 6 */
'use strict';

import $ from 'jquery';
import 'jquery-validation';
import { Accounts } from 'meteor/accounts-base';
import { Bert } from 'meteor/themeteorchef:bert';
import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { Link } from 'react-router';

import { displayError } from '../../api/global';

export default class Login extends Component {

  constructor(props) {
    super();
    this.state = {
      type: 'login'
    };
    this._oauthLogin = this._oauthLogin.bind(this);
    this._validate = this._validate.bind(this);
    this._submitEmail = this._submitEmail.bind(this);
    this._toggleType = this._toggleType.bind(this);
  }

  componentDidMount() {
    this._validate();
  }
  _oauthLogin(service, ev) {
    const options = {
          requestPermissions: ['email']
        };
    Meteor[service](options, (err) => {
      if (err) {
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
  _validate() {
    const that = this;
    $(this.refs.emailForm).validate({
      submitHandler() {
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
    $('#sign-in-with-email-modal').modal('hide');
    if (type === 'register') {
      Accounts.createUser({
        email: email,
        password: password
      }, (err) => {
        if (err && err.reason !== 'Login forbidden') {
            if (err.error && err.reason) {
              displayError(err, { title: err.error, message: err.reason, type: 'warning' });
            } else {
              displayError(err);
            }
        } else {
          Bert.alert({
            message: 'Please check your email to verify your account',
            type: 'success'
          });
        }
      });
    } else {
      Meteor.loginWithPassword(email, password, (err) => {
        if (err) {
          displayError(err, { title: err.reason, type: 'warning' });
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
    const { type } = this.state;
    return (
      <div className="flex-container">
          <div className="signin-form">
              <h2 className="title-text">2016 NFL Confidence Pool {type === 'login' ? 'Login' : 'Registration'}</h2>
              <div className="login-form">
                  <form ref="emailForm" id="sign-in-with-email" onSubmit={this._emailLogin}>
                      <div className="form-inputs">
                        <input ref="email" type="email" name="email" id="email" className="form-control" placeholder="Email" />
                        <input ref="password" type="password" name="password" id="password" className="form-control" placeholder="Password" />
                      </div>
                      <br/>
                      <div className="row">
                          <div className="col-xs-12">
                              <button type="submit" className="btn btn-block btn-success"><strong>{type === 'login' ? 'SIGN IN WITH EMAIL' : 'REGISTER WITH EMAIL'}</strong></button>
                          </div>
                      </div>
                  </form>
              </div>
              <div className="reg-btns">
                  <br/>
                  <div className="row">
                      <div className="col-xs-12 text-xs-center">Or quickly {type === 'login' ? 'login with' : 'register with'}:</div>
                  </div>
                  <div className="row">
                      <div className="col-xs-6">
                          <button type="button" className="btn btn-block btn-primary" onClick={this._oauthLogin.bind(null, 'loginWithFacebook')}>
                            <i className="fa fa-facebook"></i>
                          </button>
                      </div>
                      <div className="col-xs-6">
                          <button type="button" className="btn btn-block btn-danger" onClick={this._oauthLogin.bind(null, 'loginWithGoogle')}>
                            <i className="fa fa-google"></i>
                          </button>
                      </div>
                  </div>
              </div>
              <div className="bottom-wrapper">
                  <div className="row">
                      <div className="col-xs-12">
                          <button type="button" className="btn btn-block btn-default" onClick={this._toggleType}>{type === 'login' ? 'Register Instead' : 'Login Instead'}</button>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    );
  }
}
