/*jshint esversion: 6 */
'use strict';

import React, { Component, PropTypes } from 'react';

export default class EditProfile extends Component {

  constructor(props) {
    const { location } = props,
      isCreate = location.pathname.indexOf('create') > -1,
      isEdit = !isCreate,
      user = Meteor.user();
    super();
    this.state = {
      isCreate,
      isEdit,
      showReferredBy: false,
      firstName: user.first_name,
      lastName: user.last_name,
      teamName: user.team_name,
      referredBy: ''
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
  _updateUser(ev) {
//TODO convert to react state instead of jquery
    const { firstName, isCreate, lastName, referredBy, teamName } = this.state,
        { router } = this.context,
        DONE_REGISTERING = true;
    ev.preventDefault();
    console.log('Update user');
    if (isCreate) {
      Bert.alert(`Thanks for registering, ${firstName}`, 'success');
      router.push('/');
    }
  }

  render() {
    const { firstName, isCreate, isEdit, lastName, referredBy, showReferredBy, teamName } = this.state,
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
              <button type="submit" className="btn btn-primary">
                <i className="fa fa-fw fa-save"></i>
                Save
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
