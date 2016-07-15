Accounts.emailTemplates.siteName = "NFL Confidence Pool";
Accounts.emailTemplates.from     = "Brian Duffey <bduff9@gmail.com>";

Accounts.emailTemplates.verifyEmail = {
  subject() {
    return "[NFL Confidence Pool] Verify Your Email Address";
  },
  text(user, url) {
    let emailAddress   = user.email,
        urlWithoutHash = url.replace('#/', ''),
        emailBody      = `To verify your email address (${emailAddress}) visit the following link:\n\n${urlWithoutHash}\n\n If you did not request this verification, please ignore this email.`;
    return emailBody;
  }
};