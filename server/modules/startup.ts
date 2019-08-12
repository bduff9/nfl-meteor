/* globals Modules */

const _setBrowserPolicies = (): void => { };

let startup = (): void => {
	_setBrowserPolicies();
	//@ts-ignore
	Modules.server.configureServices();
};

//@ts-ignore
Modules.server.startup = startup;
