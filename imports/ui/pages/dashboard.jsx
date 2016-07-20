import React from 'react';

export const Dashboard = (props) => {
  callAPI = (ev) => {
    const currYear = new Date.getYear(),
        week = 1,
        url = `http://www03.myfantasyleague.com/${currYear}/export?TYPE=nflSchedule&L=&W=${week}&JSON=1`;
    console.log(url);
  };

  return (
    <div>
      <h3>Dashboard</h3>
      <button type="button" className="btn btn-primary" onClick={callAPI}>
        Call API
      </button>
    </div>
  );
};
