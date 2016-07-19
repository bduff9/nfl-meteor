/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';
import { Meteor } from 'meteor/meteor';
import { Link } from 'react-router';

export default class Login extends Component {

  constructor(props) {
    super();
    this.state = {};
    this._oauthLogin = this._oauthLogin.bind(this);
    this._emailLogin = this._emailLogin.bind(this);
  }

  _oauthLogin(service, ev) {
    const options = {
          requestPermissions: ['email']
        };
    Meteor[service](options, (err) => {
      if (err) {
        Bert.alert({
          message: err.message,
          type: 'danger'
        });
      } else {
        Bert.alert({
          message: 'Welcome!',
          type: 'success',
          icon: 'fa-thumbs-up'
        });
      }
    });
  }
  _emailLogin(type, ev) {
    const email = jQuery('#email').val().trim(),
        password = jQuery('#password').val().trim();
    ev.preventDefault();
//TODO validation
    jQuery('#sign-in-with-email-modal').modal('hide');
    if (type === 'create') {
      Accounts.createUser({
        email: email,
        password: password
      }, (err) => {
        if (err) {
          if (err.reason !== 'Login forbidden') {
            if (err.error && err.reason) {
              Bert.alert({ title: err.error, message: err.reason, type: 'warning' });
            } else {
              Bert.alert(err.reason, 'danger');
            }
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
          Bert.alert(err.reason, 'warning');
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

  render() {
    return (
      <div>
        <ul className="btn-list">
          <li>
            <button type="button" className="btn btn-primary" onClick={this._oauthLogin.bind(null, 'loginWithFacebook')}>
              <i className="fa fa-facebook"></i> Sign in with Facebook
            </button>
          </li>
          <li>
            <button type="button" className="btn btn-danger" onClick={this._oauthLogin.bind(null, 'loginWithGoogle')}>
              <i className="fa fa-google"></i> Sign in with Google
            </button>
          </li>
          <li>
            <button type="button" className="btn btn-success" data-toggle="modal" data-target="#sign-in-with-email-modal">
              <i className="fa fa-envelope"></i> Sign in with Email
            </button>
          </li>
        </ul>
        <div className="modal fade" id="sign-in-with-email-modal" tabIndex="-1" role="dialog" aria-labelledby="sign-in-with-email-modal" aria-hidden="true">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <button type="button" className="close" data-dismiss="modal">
                  <span aria-hidden="true">&times;</span>
                  <span className="sr-only">Close</span>
                </button>
                <h4 className="modal-title" id="sign-in">Sign In With Email</h4>
              </div>
              <form id="sign-in-with-email">
                <div className="modal-body">
                  <div className="form-group">
                    <label htmlFor="emailAddress">Email Address</label>
                    <input type="email" name="emailAddress" id="email" className="form-control" placeholder="What's your email, friend?" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" name="password" id="password" className="form-control" placeholder="How about a password, pal?" />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary" onClick={this._emailLogin.bind(null, 'create')}>Create Account</button>
                  <button type="submit" className="btn btn-default" onClick={this._emailLogin.bind(null, 'login')}>Sign In</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
