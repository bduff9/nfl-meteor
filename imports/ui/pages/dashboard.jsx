import React from 'react';
import { Session } from 'meteor/session';

import { displayError } from '../../api/global';

export const Dashboard = (props) => {
  return (
    <div>
      <h3>Dashboard</h3>
      Current Week: {Session.get('currentWeek')}
      <br />
      Selected Week: {Session.get('selectedWeek')}
    </div>
  );
};
