const fs = require('fs');
const fetch = require('node-fetch');
const AdmZip = require('adm-zip');
const inquirer = require('inquirer');

const LICENCE_KEY_REGEXP = /([A-Z0-9]{8}-){3}[A-Z0-9]{8}/;

const URL = 'https://j9zvjtvpx7.execute-api.eu-central-1.amazonaws.com/tokens';
const ZIP_FILE = 'less.zip';

const transform = async (config, secrets) => {
  const {license: {key, email}} = secrets;
  const {
    source: {tokensFile},
    target: {lessDir},
  } = config;
  const url = config.internal?.url || URL;

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
  if (403 === status) {
    throw 'Authorization failed. Verify your license key and email.';
  }
  if (status >= 300) {
    throw 'Response status: ' + status;
  }

  const data = await response.text();
  fs.writeFileSync(ZIP_FILE, data, {encoding: 'base64'});
  const zip = new AdmZip(ZIP_FILE, {});
  zip.extractAllTo(lessDir, true, true);
  fs.unlinkSync(ZIP_FILE);
};

const savePrettyPrinted = (file, object) => fs.writeFileSync(file, JSON.stringify(object, null, 2));

const configureUsingWizard = (configFile, secretsFile) => {
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
            console.log(`${secretsFile} contains sensitive data - it is recommended not to commit it`);
            savePrettyPrinted(secretsFile, {
              license: {
                key: licenseKey,
                email: licenseEmail
              }
            });
            savePrettyPrinted(configFile, {
              source: { tokensFile },
              target: { lessDir }
            });
            if (!fs.existsSync(tokensFile)) {
              fs.mkdirSync(tokensFile.replace(/\/[^/]+$/, ''), {recursive: true});
              fs.writeFileSync(tokensFile, '', {encoding: 'utf-8'});
            }
            if (!fs.existsSync(lessDir)) {
              fs.mkdirSync(lessDir, {recursive: true});
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