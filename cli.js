#!/usr/bin/env node

const {transform, configure} = require('./index');
const fs = require('fs');

const CONFIG_FILENAME = 'tokens-transformer.config.json';
const SECRETS_FILENAME = 'tokens-transformer.secret.json';
const CONFIG_FILE = process.env.PWD + '/' + CONFIG_FILENAME;
const SECRETS_FILE = process.env.PWD + '/' + SECRETS_FILENAME;

const commandName = process.argv[2];

if (!commandName) {
  throw 'Command name parameter is required!';
}

const logMissingConfiguration = (filename, envVariables) => console.log(
  `Config file: ${filename} needs to be created.\n`
  + `Use this command: npx figma-tokens-transformer configure\n`
  + `or create the file yourself (see the docs).\n`
  + `You can also use environment variables (useful in CI):\n`
  + envVariables,
);

const COMMANDS = {
  transform: () => {
    const {LICENSE_KEY, LICENSE_EMAIL, SOURCE_FILE, TARGET_DIR} = process.env;
    const secretsInEnv = LICENSE_KEY && LICENSE_EMAIL;
    if (!secretsInEnv && !fs.existsSync(SECRETS_FILE)) {
      logMissingConfiguration(SECRETS_FILENAME, 'LICENSE_KEY, LICENSE_EMAIL');
      return;
    }
    const configInEnv = SOURCE_FILE && TARGET_DIR;
    if (!configInEnv && !fs.existsSync(CONFIG_FILE)) {
      logMissingConfiguration(CONFIG_FILENAME, 'SOURCE_FILE, TARGET_DIR');
      return;
    }
    const config = configInEnv ? {source: {tokensFile: SOURCE_FILE}, target: {lessDir: TARGET_DIR}}
                               : JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    const secrets = secretsInEnv ? {license: {key: LICENSE_KEY, email: LICENSE_EMAIL}}
                                 : JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf-8'));
    transform(config, secrets)
      .catch(error => console.error('Transformation error! ' + error));
  },
  configure: () => {
    configure(CONFIG_FILE, SECRETS_FILE);
  },
};

const command = COMMANDS[commandName];
if (!command) {
  throw `Unknown command: ${commandName}, available commands: ${Object.keys(COMMANDS).join(', ')}`;
}
command();