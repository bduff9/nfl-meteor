/*jshint esversion: 6 */
'use strict';

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import { NO_MISS_WEEK } from '../../api/constants';
import { DashLayout } from '../layouts/DashLayout.jsx';
import { User } from '../../api/schema';

export default createContainer(({ sortBy, user, _changeSortBy }) => {
  const dataHandle = Meteor.subscribe('overallPlaces'),
      dataReady = dataHandle.ready();
  let sort = sortBy || { total_points: -1, total_games: -1 },
      data = [];
  if (dataReady) {
    data = User.find({ done_registering: true }, { sort }).fetch()
      .map((u, i, allUsers) => {
        const missedGames = u.picks.filter(pick => pick.week >= NO_MISS_WEEK && pick.winner_id && !pick.pick_id);
        return {
          _id: u._id,
          first_name: u.first_name,
          last_name: u.last_name,
          team_name: u.team_name,
          missed_games: (missedGames.length > 0 ? 'Y' : ''),
          place: (u.overall_place ? (u.overall_tied_flag ? `T${u.overall_place}` : u.overall_place) : 'T1'),
          total_games: u.total_games,
          total_points: u.total_points,
          overall_place: u.overall_place,
          overall_tied_flag: u.overall_tied_flag
        };
      });
  }
  return {
    data,
    dataReady,
    isOverall: true,
    sort,
    user,
    _changeSortBy
  };
}, DashLayout);
