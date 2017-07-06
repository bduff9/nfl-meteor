/* globals Modules */
'use strict';

import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';

const services = Meteor.settings.private.oAuth;

const configure = () => {
	if (services) {
		for (let service in services) {
			ServiceConfiguration.configurations.upsert({ service: service }, {
				$set: services[service]
			});
		}
	}
};

Modules.server.configureServices = configure;
