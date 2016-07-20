import { Meteor } from 'meteor/meteor';

import '../imports/api/collections/users';
import '../imports/api/collections/games';
import { User } from '../imports/api/schema';

const gmailUrl = Meteor.settings.private.gmail;

Meteor.startup(() => {
  process.env.MAIL_URL = gmailUrl;

  Accounts.onCreateUser((options, user) => {
    const EMPTY_VAL = '';
    let first_name = EMPTY_VAL,
        last_name = EMPTY_VAL,
        email = EMPTY_VAL,
        verified = true,
        existingCount;
//TODO handle sign up expiration here
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
    user.picks = [];//TODO fill with one per game plus one extra per week (bonus)
    user.tiebreakers = [];//TODO fill with one per week
    user.survivor = [];//TODO fill with one per week
//TODO log user creation
    return user;
  });

  Accounts.validateLoginAttempt((parms) => {
    const { allowed, methodName, user } = parms;
    let verified = false,
        vEmails;
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
//TODO log sign in
    return true;
  });
});
