Meteor.publish('userData', function() {
  if (!this.userId) return null;
  return Meteor.users.find(this.userId, {
    fields: {
      //'services.facebook.email': 1,
      //'services.google.email': 1,
      //'emails': 1,
      'profile': 1,
      'email': 1,
      'first_name': 1,
      'last_name': 1,
      'team_name': 1,
      'referred_by': 1,
      'verified': 1,
      'doneRegistering': 1,
      'paid': 1,
      'chat_hidden': 1,
      'total_points': 1,
      'total_games': 1,
      'bonus_points': 1,
      'picks': 1,
      'tiebreakers': 1,
      'survivor': 1
    }
  });
});
