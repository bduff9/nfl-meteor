import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  process.env.MAIL_URL = 'smtp://bduff9%40gmail.com:uylgjwmmtrmamhab@smtp.gmail.com:465';

  Accounts.onCreateUser((options, user) => {
    const EMPTY_VAL = '';
    let first_name = EMPTY_VAL,
        last_name = EMPTY_VAL,
        email = EMPTY_VAL,
        team_name = EMPTY_VAL,
        verified = true;
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
    user.profile = options.profile || {};
    user.first_name = first_name;
    user.last_name = last_name;
    user.email = email;
    user.team_name = team_name;
    user.verified = verified;
    user.doneRegistering = false;
    user.paid = false;
    user.chat_hidden = null;
    user.total_points = 0;
    user.total_games = 0;
    user.bonus_points = 0;
    user.picks = [];
    user.tiebreakers = [];
    user.survivor = [];
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
        Meteor.users.update({ _id: user._id }, {$set: { verified: true }});
      }
    }
    return true;
  });
});
