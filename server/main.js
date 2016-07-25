'use strict';

import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

import '../imports/api/collections/games';
import '../imports/api/collections/nfllogs';
import '../imports/api/collections/teams';
import '../imports/api/collections/users';
import { Game } from '../imports/api/schema';
import { currentWeek } from '../imports/api/collections/games';
import { writeLog } from '../imports/api/collections/nfllogs';
import { logError } from '../imports/api/global';

const gmailUrl = Meteor.settings.private.gmail;

Meteor.startup(() => {
  process.env.MAIL_URL = gmailUrl;

  Accounts.onCreateUser((options, user) => {
    const currentWeekSync = Meteor.wrapAsync(currentWeek.call, currentWeek),
        currWeek = currentWeekSync(),
        EMPTY_VAL = '';
    let first_name = EMPTY_VAL,
        last_name = EMPTY_VAL,
        email = EMPTY_VAL,
        verified = true,
        existingCount, firstName, lastName, logEntry;
    if (currWeek > 3) throw new Meteor.Error('Registration has ended', 'No new users are allowed after the third week.  Please try again next year');
    if (user.services.facebook) {
      first_name = user.services.facebook.first_name;
      last_name = user.services.facebook.last_name;
      email = user.services.facebook.email;
    } else if (user.services.google) {
      first_name = user.services.google.given_name;
      last_name = user.services.google.family_name;
      email = user.services.google.email;
    } else {
      email = options.email;
      verified = false;
    }
//TODO remove the next two lines if there are no issues with account melding
    //existingCount = User.find({ email }).count();
    //if (existingCount) throw new Meteor.Error('You have already registered with a different account!', 'Please use the Facebook or Google buttons to sign in');
    user.profile = options.profile || {};
    user.first_name = first_name;
    user.last_name = last_name;
    user.email = email;
    user.team_name = EMPTY_VAL;
    user.referred_by = EMPTY_VAL;
    user.verified = verified;
    user.done_registering = false;
    user.paid = false;
    user.chat_hidden = null;
    user.total_points = 0;
    user.total_games = 0;
    user.bonus_points = 0;
//TODO sort before insert so they go in in order
    user.picks = Game.find().map(game => {
      return {
        "week": game.week,
        "game_id": game._id
      };
    });
    user.tiebreakers = Game.find({ game: 1 }).map(game => {
      return {
        "week": game.week
      };
    });
    user.survivor = Game.find({ game: 1 }).map(game => {
      return {
        "week": game.week
      };
    });
    firstName = first_name || 'An unknown';
    lastName = last_name || 'user';
    writeLog.call({ userId: user._id, action: 'REGISTER', message: `${firstName} ${lastName} registered with email ${email}` }, logError);
    return user;
  });

  Accounts.validateLoginAttempt((parms) => {
    const { allowed, methodName, user } = parms;
    let verified = false,
        vEmails, logEntry;
    if (methodName === 'createUser' && parms.user) {
      Accounts.sendVerificationEmail(parms.user._id);
      return false;
    }
    if (user && !user.verified) {
      vEmails = user.emails.filter(email => email.verified);
      if (vEmails.length === 0) {
        // Should we also re-send the verification email here?
        throw new Meteor.Error('Email not verified!', 'Please check your email to verify your account');
        return false;
      } else {
        Meteor.users.update({ _id: user._id }, { $set: { verified: true }});
      }
    }
    return true;
  });
});
