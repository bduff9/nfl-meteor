const meldUserCallback = (origUser, newUser) => {
  console.log(origUser);
  console.log(newUser);
};

AccountsMeld.configure({
  askBeforeMeld: false,
  checkForConflictingServices: true,
  meldUserCallback: meldUserCallback
});