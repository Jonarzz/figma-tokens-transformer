#!/usr/bin/env node

const {transform, configure} = require('./index');
const fs = require('fs');

const CONFIG_FILENAME = 'tokens-transformer.config.json';
const CONFIG_FILE = process.env.PWD + '/' + CONFIG_FILENAME;

const commandName = process.argv[2];

if (!commandName) {
  throw 'Command name parameter is required!';
}

const COMMANDS = {
  transform: () => {
    if (!fs.existsSync(CONFIG_FILE)) {
      console.log(
        `Config file: ${CONFIG_FILENAME} needs to be created.\n`
        + `Use this command: npx figma-tokens-transformer configure\n`
        + `or create the file yourself (see the docs).`,
      );
      return;
    }
    const config = fs.readFileSync(CONFIG_FILE, 'utf-8');
    transform(JSON.parse(config))
      .catch(error => console.error('Transformation error: ', error));
  },
  configure: () => {
    configure(CONFIG_FILE);
  },
};

const command = COMMANDS[commandName];
if (!command) {
  throw `Unknown command: ${commandName}, available commands: ${Object.keys(COMMANDS).join(', ')}`;
}
command();