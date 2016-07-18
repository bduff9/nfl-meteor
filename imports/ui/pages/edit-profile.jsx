/*jshint esversion: 6 */
'use strict';

import React, { PropTypes } from 'react';

export const EditProfile = (props, context) => {
  const { location } = props,
      { router } = context,
      user = Meteor.user(),
      isCreate = location.pathname.indexOf('create') > -1,
      isEdit = !isCreate;

  const updateUser = (ev) => {
    const firstName = jQuery('#first_name').val().trim(),
        lastName = jQuery('#last_name').val().trim(),
        teamName = jQuery('#team_name').val().trim(),
        doneRegistering = true;
    ev.preventDefault();
    console.log('Update user');
    if (isCreate) {
      Bert.alert(`Thanks for registering, ${firstName}`, 'success');
      router.push('/');
    }
  };

  return (
    <div>
      <h3>{isCreate ? 'Create Profile' : 'Edit Profile'}</h3>
      <form onSubmit={updateUser}>
        <input className="form-control" type="text" id="first_name" defaultValue={user.first_name} />
        <input className="form-control" type="text" id="last_name" defaultValue={user.last_name} />
        <input className="form-control" type="text" id="team_name" defaultValue={user.team_name} />
        <button type="submit" className="btn btn-primary">
          <i className="fa fa-fw fa-save"></i>
          Save
        </button>
      </form>
    </div>
  );
};

EditProfile.contextTypes = {
  router: PropTypes.object.isRequired
};
