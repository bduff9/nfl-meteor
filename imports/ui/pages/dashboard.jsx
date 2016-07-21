import React from 'react';

import { displayError } from '../../api/global';
import { initSchedule } from '../../api/collections/games';
import { currentWeek } from '../../api/collections/games';

export const Dashboard = (props) => {
  let currWeek = '';
  currentWeek.call({}, (err, week) => {
    if (err) {
      displayError(err);
    } else {
      currWeek = week;
    }
    console.log('current week', week);
  });
  return (
    <div>
      <h3>Dashboard</h3>
      Current Week: {currWeek}
    </div>
  );
};
