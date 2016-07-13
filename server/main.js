import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  Accounts.onCreateUser((options, user) => {
    const EMPTY_VAL = '';
    let first_name = EMPTY_VAL,
        last_name = EMPTY_VAL,
        email = EMPTY_VAL,
        team_name = EMPTY_VAL,
        verified = true;
//TODO grab user data from oauth here
    if (user.services.facebook) {
      first_name = user.services.facebook.first_name;
      last_name = user.services.facebook.last_name;
      email = user.services.facebook.email;
    } else if (user.services.google) {
      first_name = user.services.google.given_name;
      last_name = user.services.google.family_name;
      email = user.services.google.email;
    } else {
      console.log('This is an email signup, ensure email and password (and verified?) are set correctly before proceeding');
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
//TODO remove when done
    console.log(options);
    console.log(user);
    return user;
  });
});
