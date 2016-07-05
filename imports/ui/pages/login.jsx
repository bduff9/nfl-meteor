import React, { Component } from 'react';
import { Link } from 'react-router';

export default class Login extends Component {

  constructor(props) {
    super();
    this.state = {};
  }

  _handleSubmit(ev) {
    ev.preventDefault();
console.log('form submit');
  }
  _oauthLogin(service, ev) {
    const options = {
      requestPermissions: ['email']
    };

    if (service === 'loginWithTwitter') {
      delete options.requestPermissions;
    }

    Meteor[service](options, (err) => {
      if (err) {
        Bert.alert(error.message, 'danger');
      }
    });
  }

  render() {
    return (
      <div>
        <form name="login" onSubmit={this._handleSubmit}>
          <input type="text" />
          <input type="password" />
          <Link to="/register">Register</Link>
          <button type="submit">Submit</button>
        </form>
        <ul className="btn-list">
          <li>
            <button type="button" className="btn" onClick={this._oauthLogin.bind(null, 'loginWithFacebook')}>
              <i className="fa fa-facebook"></i> Sign in with Facebook
            </button>
          </li>
          <li>
            <button type="button" className="btn" onClick={this._oauthLogin.bind(null, 'loginWithGoogle')}>
              <i className="fa fa-google"></i> Sign in with Google
            </button>
          </li>
          <li>
            <button type="button" className="btn" onClick={this._oauthLogin.bind(null, 'loginWithTwitter')}>
              <i className="fa fa-twitter"></i> Sign in with Twitter
            </button>
          </li>
          <li>
            <button type="button" className="btn btn-success btn-login-email" data-toggle="modal" data-target="#sign-in-with-email-modal">
              <i className="fa fa-envelope"></i> Sign in with Email
            </button>
          </li>
        </ul>
        </div>
      );
    }
  }
