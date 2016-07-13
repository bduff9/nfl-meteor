Meteor.users.allow({
  insert: () => false,
  update: () => false,
  remove: () => true
});

Meteor.users.deny({
  insert: () => true,
  update: () => true,
  remove: () => false
});
