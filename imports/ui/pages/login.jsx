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
      <div className="text-xs-center">
          <div className="reg_btns well well-lg btn-group btn-group-vertical btn-group-justified">
              <button type="button" className="btn btn-primary btn-lg btn-block" onClick={this._oauthLogin.bind(null, 'loginWithFacebook')}>
                <i className="fa fa-facebook"></i> Sign in with Facebook
              </button>
              <button type="button" className="btn btn-danger btn-lg btn-block" onClick={this._oauthLogin.bind(null, 'loginWithGoogle')}>
                <i className="fa fa-google"></i> Sign in with Google
              </button>
              <button type="button" className="btn btn-success btn-lg btn-block" data-toggle="modal" data-target="#sign-in-with-email-modal">
                <i className="fa fa-envelope"></i> Sign in with Email
              </button>
          </div>
          <div className="modal fade" id="sign-in-with-email-modal" tabIndex="-1" role="dialog" aria-labelledby="sign-in-with-email-modal" aria-hidden="true">
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <button type="button" className="close" data-dismiss="modal">
                    <span aria-hidden="true">&times;</span>
                    <span className="sr-only">Close</span>
                  </button>
                  <h4 className="modal-title" id="sign-in">{type === 'login' ? 'Sign In' : 'Register New Account'}</h4>
                </div>
                <form ref="emailForm" id="sign-in-with-email" onSubmit={this._emailLogin}>
                  <div className="modal-body">
                    <div className="form-group">
                      <label htmlFor="emailAddress">Email Address</label>
                      <input ref="email" type="email" name="email" id="email" className="form-control" placeholder="What's your email, friend?" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="password">Password</label>
                      <input ref="password" type="password" name="password" id="password" className="form-control" placeholder="How about a password, pal?" />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-default" onClick={this._toggleType}>{type === 'login' ? 'Register Instead' : 'Login Instead'}</button>
                    <button type="submit" className="btn btn-primary">{type === 'login' ? 'Sign In' : 'Register'}</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
      </div>
    );
  }
}
