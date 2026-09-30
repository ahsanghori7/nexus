const jsdomEnvModule = require('jest-environment-jsdom');
const JsdomEnvironment = jsdomEnvModule.default || jsdomEnvModule;

// Ensure canvas is mocked before jsdom initializes.
require('./jest.canvas-setup');

class CustomJestEnvironment extends JsdomEnvironment {}

module.exports = CustomJestEnvironment;
