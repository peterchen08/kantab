/* eslint-disable capitalized-comments */
const os = require('os');
const LogLevels = require('moleculer').LogLevels;
const dotenvFlow = require('dotenv-flow');
const _ = require('lodash');

const util = require('util');


const processEnv = process.env;
const envVariables = Object.keys(
		dotenvFlow.parse("./.env"),
	);

const configObj = _.pick(processEnv, envVariables);

// console.log(util.inspect(processEnv, {showHidden: false, depth: null}))
// console.log(util.inspect(envVariables, {showHidden: false, depth: null}))

const isTrue = (text) => [1, true, '1', 'true', 'yes'].includes(text || '');

const isFalse = (text) => [0, false, '0', 'false', 'no'].includes(text || '');

const getValue = (text, defaultValud) => {
	const vtrue = isTrue(text);
	const vfalse = isFalse(text);
	const val = text || defaultValud;
	if (vtrue) {
		return true;
	} else if (vfalse) {
		return false;
	}
	return val;
};

const HOST_NAME = os.hostname().toLowerCase();

class ConfigClass {
	

	constructor() {
		Object.keys(configObj).forEach((key) => {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			this[key] = configObj[key];
		});
		this.NODE_ENV = process.env.NODE_ENV;
		this.NODEID = `${HOST_NAME}-${this.NODE_ENV}`;
	}
}

module.exports = new ConfigClass();
