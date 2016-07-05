let startup = () => {
  Modules.server.setEnvironmentVariables();
  _setBrowserPolicies();
  Modules.server.configureServices();
};

var _setBrowserPolicies = () => {};

Modules.server.startup = startup;
