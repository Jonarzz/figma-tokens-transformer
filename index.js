const fs = require('fs');
const fetch = require('node-fetch');
const AdmZip = require('adm-zip');
const inquirer = require('inquirer');

const GUMROAD_KEY_REGEXP = /^([a-zA-Z0-9]{8}-){3}[a-zA-Z0-9]{8}$/;
const LEMON_KEY_REGEXP = /^[a-zA-Z0-9]{8}-([a-zA-Z0-9]{4}-){3}[a-zA-Z0-9]{12}$/;
const LICENSE_KEY_REGEXP = new RegExp(GUMROAD_KEY_REGEXP.source + '|' + LEMON_KEY_REGEXP.source);

const V4_URL = 'https://gp0k29hbna.execute-api.eu-central-1.amazonaws.com/tokens';
const V5_URL = ' https://rr49g4zy8d.execute-api.eu-central-1.amazonaws.com/tokens';
const ZIP_FILE = 'tokens.zip';

// noinspection EqualityComparisonWithCoercionJS
const isV5 = version => 5 == version;

const transform = async (config, secrets) => {
  const {license: {key, email}} = secrets;
  const {
    version,
    source: {tokensFile},
    target: {lessDir, jsonsDir},
  } = config;
  if (isV5(version)) {
    console.log(`Tokens transformer configured for Ant Design v5`);
  }
  const url = config.internal?.url || (isV5(version) ? V5_URL : V4_URL);

  console.log(`Transforming ${tokensFile} file...`);
  const tokensFileContent = fs.readFileSync(tokensFile, {encoding: 'utf-8'});
  const body = JSON.stringify(JSON.parse(tokensFileContent));
  const response = await fetch(url, {
    body,
    method: 'POST',
    headers: {
      Authorization: key,
      From: email,
    },
  });
  const status = response.status;
  if (404 === status) {
    throw `Invalid transformation URL. `
          + `Make sure you're using the newest version of figma-tokens-transformer. `
          + `Run 'npm update figma-tokens-transformer' command to download the newest version `
          + `and use 'npm outdated' command to find outdated dependencies.`;
  }
  if (403 === status) {
    throw 'Authorization failed. Verify your license key and email.';
  }
  if (status >= 300) {
    throw 'Response status: ' + status;
  }

  const data = await response.text();
  fs.writeFileSync(ZIP_FILE, data, {encoding: 'base64'});
  const zip = new AdmZip(ZIP_FILE, {});
  const targetDir = isV5(version) ? jsonsDir : lessDir;
  zip.extractAllTo(targetDir, true, true);
  fs.unlinkSync(ZIP_FILE);
};

const savePrettyPrinted = (file, object) => fs.writeFileSync(file, JSON.stringify(object, null, 2));

const configureUsingWizard = (configFile, secretsFile) => {
  inquirer.prompt([{
            type: 'input',
            name: 'licenseKey',
            message: 'License key',
            validate: value => {
              if (value.match(LICENSE_KEY_REGEXP)) {
                return true;
              }
              return 'Invalid licence key format';
            },
          }, {
            type: 'input',
            name: 'licenseEmail',
            message: 'License email',
            validate: value => /\S+@\S+\.\S+/.test(value) || 'Invalid email'
          }, {
            type: 'list',
            name: 'version',
            message: 'Ant Design version',
            choices: [4, 5]
          }, {
            type: 'input',
            name: 'tokensFile',
            message: 'Relative path to the source tokens file',
            validate: value => (value?.endsWith('.json'))|| 'Invalid tokens file'
          }, {
            type: 'input',
            name: 'lessDir',
            message: 'Relative path to the target directory where less files should be saved in',
            when: ({version}) => 5 !== version,
            validate: value => !!value || 'Invalid target directory'
          }, {
            type: 'input',
            name: 'jsonsDir',
            message: 'Relative path to the target directory where transformed JSON token files should be saved in',
            when: ({version}) => 5 === version,
            validate: value => !!value || 'Target directory cannot be empty'
          }])
          .then(({licenseKey, licenseEmail, version, tokensFile, lessDir, jsonsDir}) => {
            console.log(`${secretsFile} contains sensitive data - it is recommended not to commit it`);
            savePrettyPrinted(secretsFile, {
              license: {
                key: licenseKey,
                email: licenseEmail
              }
            });
            savePrettyPrinted(configFile, {
              version,
              source: { tokensFile },
              target: { lessDir, jsonsDir }
            });
            if (!fs.existsSync(tokensFile)) {
              fs.mkdirSync(tokensFile.replace(/\/[^/]+$/, ''), {recursive: true});
              fs.writeFileSync(tokensFile, '', {encoding: 'utf-8'});
            }
            const targetDir = lessDir || jsonsDir;
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, {recursive: true});
            }
          });
};

const configure = (configFile, secretsFile) => {
  if (fs.existsSync(configFile) || fs.existsSync(secretsFile)) {
    inquirer.prompt([{
      type: 'confirm',
      name: 'override',
      message: 'Config files already exist, override?',
      default: false,
    }]).then(({override}) => {
      if (override) {
        configureUsingWizard(configFile, secretsFile);
      }
    });
  } else {
    configureUsingWizard(configFile, secretsFile);
  }
};

module.exports = {
  transform,
  configure
};