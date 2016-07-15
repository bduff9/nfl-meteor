import React from 'react';

export const EditProfile = (props) => {
  const { location } = props,
      isCreate = location.pathname.indexOf('create') > -1,
      isEdit = !isCreate;
  return (
    <h3>{isCreate ? 'Create Profile' : 'Edit Profile'}</h3>
  );
};