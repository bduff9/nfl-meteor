Facebook = {};

OAuth.registerService('facebook', 2, null, function (query) {
	let response = getTokenResponse(query);
	let accessToken = response.accessToken;

	// include all fields from facebook
	// http://developers.facebook.com/docs/reference/login/public-profile-and-friend-list/
	let whitelisted = [
		'id',
		'email',
		'name',
		'first_name',
		'last_name',
		'link',
		'gender',
		'locale',
		'age_range',
	];

	let identity = getIdentity(accessToken, whitelisted);

	let serviceData = {
		accessToken: accessToken,
		expiresAt: +new Date() + 1000 * response.expiresIn,
	};

	let fields = _.pick(identity, whitelisted);

	_.extend(serviceData, fields);

	return {
		serviceData: serviceData,
		options: { profile: { name: identity.name } },
	};
});

// checks whether a string parses as JSON
let isJSON = function (str) {
	try {
		JSON.parse(str);

		return true;
	} catch (e) {
		return false;
	}
};

// returns an object containing:
// - accessToken
// - expiresIn: lifetime of token in seconds
var getTokenResponse = function (query) {
	let config = ServiceConfiguration.configurations.findOne({
		service: 'facebook',
	});

	if (!config) throw new ServiceConfiguration.ConfigError();

	let responseContent;

	try {
		// Request an access token
		responseContent = HTTP.get(
			'https://graph.facebook.com/v2.8/oauth/access_token',
			{
				params: {
					client_id: config.appId,
					redirect_uri: OAuth._redirectUri('facebook', config),
					client_secret: OAuth.openSecret(config.secret),
					code: query.code,
				},
			},
		).data;
	} catch (err) {
		throw _.extend(
			new Error(
				'Failed to complete OAuth handshake with Facebook. ' + err.message,
			),
			{ response: err.response },
		);
	}

	// Handle response
	let fbAccessToken = responseContent.access_token;
	let fbExpires = responseContent.expires_in;

	if (!fbAccessToken) {
		throw new Error(
			'Failed to complete OAuth handshake with facebook ' +
				"-- can't find access token in HTTP response. " +
				responseContent,
		);
	}

	return {
		accessToken: fbAccessToken,
		expiresIn: fbExpires,
	};
};

var getIdentity = function (accessToken, fields) {
	try {
		return HTTP.get('https://graph.facebook.com/v2.8/me', {
			params: {
				access_token: accessToken,
				fields: fields.join(','),
			},
		}).data;
	} catch (err) {
		throw _.extend(
			new Error('Failed to fetch identity from Facebook. ' + err.message),
			{ response: err.response },
		);
	}
};

Facebook.retrieveCredential = function (credentialToken, credentialSecret) {
	return OAuth.retrieveCredential(credentialToken, credentialSecret);
};
