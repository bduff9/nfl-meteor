/*jshint esversion: 6 */
'use strict';

import React from 'react';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import { DashLayout } from '../layouts/DashLayout.jsx';
import { User } from '../../api/collections/users';

export default createContainer(({ sortBy, user, week, _changeSortBy }) => {
  const dataHandle = Meteor.subscribe('weekPlaces', week),
      dataReady = dataHandle.ready(),
      sort = sortBy || { "tiebreakers.$.points_earned": -1, "tiebreakers.$.games_correct": -1 };
  let data = [],
      highestScore = 0;
  if (dataReady) {
    data = User.find({ done_registering: true, "tiebreakers.week": week }, { sort }).fetch()
      .map((u, i, allUsers) => {
        const tiebreaker = Object.assign({}, u.tiebreakers.filter(tb => tb.week === week)[0]),
            place = (tiebreaker.place_in_week ? (tiebreaker.tied_flag ? `T${tiebreaker.place_in_week}` : tiebreaker.place_in_week) : 'T1'),
            hasSubmitted = user.tiebreakers.filter(tb => tb.week === week)[0].submitted;
        highestScore = Math.max(highestScore, tiebreaker.points_earned);
        if (!hasSubmitted) tiebreaker.last_score = null;
        return {
          _id: u._id,
          first_name: u.first_name,
          last_name: u.last_name,
          team_name: u.team_name,
          place,
          possible_games: u.picks.reduce((prev, pick) => {
            if (pick.week !== week) return prev;
            if (pick.pick_id === pick.winner_id || (pick.pick_id && !pick.winner_id)) {
              return prev + 1;
            }
            return prev;
          }, 0),
          possible_points: u.picks.reduce((prev, pick) => {
            if (pick.week !== week) return prev;
            if (pick.pick_id === pick.winner_id || (pick.pick_id && !pick.winner_id)) {
              return prev + (pick.points || 0);
            }
            return prev;
          }, 0),
          tiebreaker,
          total_games: tiebreaker.games_correct,
          total_points: tiebreaker.points_earned
        };
    });
  }
  return {
    data,
    dataReady,
    highestScore,
    isOverall: false,
    sort,
    user,
    week,
    _changeSortBy
  };
}, DashLayout);
