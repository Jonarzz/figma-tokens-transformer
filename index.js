const fs = require('fs');
const fetch = require('node-fetch');
const AdmZip = require('adm-zip');
const inquirer = require('inquirer');

const LICENCE_KEY_REGEXP = /([A-Z0-9]{8}-){3}[A-Z0-9]{8}/;

const URL = 'https://j9zvjtvpx7.execute-api.eu-central-1.amazonaws.com/tokens';
const ZIP_FILE = 'less.zip';

const transform = async (config) => {
  const {
    license: {key, email},
    source: {tokensFile},
    target: {lessDir},
  } = config;
  const url = config.internal?.url || URL;

  console.log(`Transforming ${tokensFile} file`);
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
  if (status >= 300) {
    throw 'Response status: ' + status;
  }

  const data = await response.text();
  fs.writeFileSync(ZIP_FILE, data, {encoding: 'base64'});
  const zip = new AdmZip(ZIP_FILE, {});
  zip.extractAllTo(lessDir, true, true);
  fs.unlinkSync(ZIP_FILE);
};

const configureUsingWizard = configFile => {
  inquirer.prompt([{
            type: 'input',
            name: 'licenseKey',
            message: 'License key',
            validate: value => {
              if (value.match(LICENCE_KEY_REGEXP)) {
                return true;
              }
              return 'Invalid licence key format';
            },
          }, {
            type: 'input',
            name: 'licenseEmail',
            message: 'License email',
          }, {
            type: 'input',
            name: 'tokensFile',
            message: 'Relative path to the source tokens file',
          }, {
            type: 'input',
            name: 'lessDir',
            message: 'Relative path to the target directory where less files should be saved in',
          }])
          .then(({licenseKey, licenseEmail, tokensFile, lessDir}) => {
            fs.writeFileSync(configFile, JSON.stringify({
              license: {
                key: licenseKey,
                email: licenseEmail
              },
              source: {
                tokensFile
              },
              target: {
                lessDir
              }
            }, null, 2));
          });
};

const configure = configFile => {
  if (fs.existsSync(configFile)) {
    inquirer.prompt([{
      type: 'confirm',
      name: 'override',
      message: 'Config file already exists, override?',
      default: false,
    }]).then(({override}) => {
      if (override) {
        configureUsingWizard(configFile);
      }
    });
  } else {
    configureUsingWizard(configFile);
  }
};

module.exports = {
  transform,
  configure
};