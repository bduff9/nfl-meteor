/*jshint esversion: 6 */
'use strict';

import { Meteor } from 'meteor/meteor';
import React, { Component, PropTypes } from 'react';

import { updateUser } from '../../api/collections/users';
import { displayError } from '../../api/global';

export default class EditProfile extends Component {

  constructor(props) {
    const { location } = props,
      isCreate = location.pathname.indexOf('create') > -1,
      isEdit = !isCreate,
      user = Meteor.user();
    super();
    this.state = {
      firstName: user.first_name,
      hasFacebook: !!user.services.facebook,
      hasGoogle: !!user.services.google,
      isCreate,
      isEdit,
      lastName: user.last_name,
      teamName: user.team_name,
      referredBy: user.referred_by,
      showReferredBy: false
    };
    this._handleChanges = this._handleChanges.bind(this);
    this._handleReferredBy = this._handleReferredBy.bind(this);
    this._updateUser = this._updateUser.bind(this);
  }

  _handleChanges(ev) {
    const el = ev.currentTarget;
    this.setState({ [el.id]: el.value });
  }
  _handleReferredBy(showReferredBy, ev) {
    this.setState({ showReferredBy, referredBy: (!showReferredBy ? 'RETURNING' : this.state.referredBy) });
  }
  _oauthLink(service, ev) {
    const options = {
          requestPermissions: ['email']
        };
    Meteor[service](options, (err) => {
      if (err && err.errorType !== 'Accounts.LoginCancelledError') {
        displayError(err.message);
      } else {
        Bert.alert({
          message: 'Successfully linked!',
          type: 'success'
        });
      }
    });
  }
  _updateUser(ev) {
    const { firstName, isCreate, lastName, referredBy, teamName } = this.state,
        { router } = this.context,
        userId = Meteor.userId(),
        DONE_REGISTERING = true;
    ev.preventDefault();
//TODO client validation
    try {
      updateUser.call({ done_registering: DONE_REGISTERING, first_name: firstName, last_name: lastName, referred_by: referredBy, team_name: teamName }, displayError);
      if (isCreate) {
        Bert.alert(`Thanks for registering, ${firstName}`, 'success');
        router.push('/');
      } else {
        Bert.alert({
          message: 'Profile saved!',
          type: 'success',
          icon: 'fa-save'
        });
      }
    } catch(err) {
      displayError(err.reason);
    }
  }

  render() {
    const { firstName, hasFacebook, hasGoogle, isCreate, isEdit, lastName, referredBy, showReferredBy, teamName } = this.state,
        user = Meteor.user();
    return (
      <div className="container-fluid">
        <h3>{isCreate ? 'Finish Registration' : 'Edit My Profile'}</h3>
        <br />
        <form onSubmit={this._updateUser}>
          <div className="row">
            <div className="col-xs-12 form-group floating-label-form-group floating-label-form-group-with-value">
              <label>Email</label>
              <p className="form-control-static">{user.email}</p>
            </div>
          </div>
          <div className="row">
            <div className={'col-xs-6 form-group floating-label-form-group' + (user.first_name ? ' floating-label-form-group-with-value' : '')}>
              <label htmlFor="first_name">First Name</label>
              <input type="text" className="form-control" id="firstName" placeholder="First Name" value={firstName} required={true} onChange={this._handleChanges} />
            </div>
            <div className={'col-xs-6 form-group floating-label-form-group' + (user.last_name ? ' floating-label-form-group-with-value' : '')}>
              <label htmlFor="last_name">Last Name</label>
              <input type="text" className="form-control" id="lastName" placeholder="Last Name" value={lastName} required={true} onChange={this._handleChanges} />
            </div>
          </div>
          <div className="row">
            <div className={'col-xs-12 form-group floating-label-form-group' + (user.team_name ? ' floating-label-form-group-with-value' : '')}>
              <label htmlFor="team_name">Team Name (Optional)</label>
              <input type="text" className="form-control" id="teamName" placeholder="Team Name (Optional)" value={teamName} onChange={this._handleChanges} />
            </div>
          </div>
          {isCreate ?
            <div className="row">
              <div className="col-xs-12 form-group">
                <div className="radio">
                  <label>
                    <input type="radio" id="referred_byN" name="was_referred" onClick={this._handleReferredBy.bind(null, false)} />
                    I have played previously
                  </label>
                </div>
                <div className="radio">
                  <label>
                    <input type="radio" id="referred_byY" name="was_referred" onClick={this._handleReferredBy.bind(null, true)} />
                    I am new and was referred by:
                  </label>
                </div>
              </div>
            </div>
            :
            null
          }
          {showReferredBy ?
            <div className="row">
              <div className={'col-xs-12 form-group floating-label-form-group' + (user.referred_by ? ' floating-label-form-group-with-value' : '')}>
                <label htmlFor="referred_by">Name of Referrer</label>
                <input type="text" className="form-control" id="referredBy" placeholder="Referred By" defaultValue={referredBy} onChange={this._handleChanges} />
              </div>
            </div>
            :
            null
          }
          <div className="row">
            <div className="col-xs-12 form-group">
              {/* Add service check to show unlink option */}
              <button type="button" className="btn btn-primary" disabled={hasFacebook} onClick={this._oauthLink.bind(null, 'loginWithFacebook')}>
                <i className="fa fa-facebook"></i> {hasFacebook ? 'Facebook Linked!' : 'Link Facebook'}
              </button>
              <button type="button" className="btn btn-danger" disabled={hasGoogle} onClick={this._oauthLink.bind(null, 'loginWithGoogle')}>
                <i className="fa fa-google"></i> {hasGoogle ? 'Google Linked!' : 'Link Google'}
              </button>
              <button type="submit" className="btn btn-primary">
                <i className="fa fa-fw fa-save"></i>
                {isCreate ? 'Finish Registration' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

EditProfile.contextTypes = {
  router: PropTypes.object.isRequired
};
