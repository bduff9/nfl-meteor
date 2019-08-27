Facebook = {};

// Request Facebook credentials for the user
//
// @param options {optional}
// @param credentialRequestCompleteCallback {Function} Callback function to call on
//   completion. Takes one argument, credentialToken on success, or Error on
//   error.
Facebook.requestCredential = function (
	options,
	credentialRequestCompleteCallback,
) {
	// support both (options, callback) and (callback).
	if (!credentialRequestCompleteCallback && typeof options === 'function') {
		credentialRequestCompleteCallback = options;
		options = {};
	}

	const config = ServiceConfiguration.configurations.findOne({
		service: 'facebook',
	});

	if (!config) {
		credentialRequestCompleteCallback &&
			credentialRequestCompleteCallback(new ServiceConfiguration.ConfigError());

		return;
	}

	const credentialToken = Random.secret();
	const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|Windows Phone/i.test(
		navigator.userAgent,
	);
	const display = mobile ? 'touch' : 'popup';

	let scope = 'email';

	if (options && options.requestPermissions)
		scope = options.requestPermissions.join(',');

	const loginStyle = OAuth._loginStyle('facebook', config, options);

	const loginUrl =
		'https://www.facebook.com/v2.8/dialog/oauth?client_id=' +
		config.appId +
		'&redirect_uri=' +
		OAuth._redirectUri('facebook', config) +
		'&display=' +
		display +
		'&scope=' +
		scope +
		'&state=' +
		OAuth._stateParam(
			loginStyle,
			credentialToken,
			options && options.redirectUrl,
		);

	OAuth.launchLogin({
		loginService: 'facebook',
		loginStyle: loginStyle,
		loginUrl: loginUrl,
		credentialRequestCompleteCallback: credentialRequestCompleteCallback,
		credentialToken: credentialToken,
	});
};
