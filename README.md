# Ant for Figma tokens transformer
Tool transforming Ant Design for Figma tokens to less files.

## Usage

1. Add the dependency:

`npm install figma-tokens-transformer --save-dev`

2. Create the configuration file using CLI wizard:

`npx figma-tokens-transformer configure`

Remember to add the generated secrets file to `.gitignore` 
as it contains sensitive data (license key, email).

3. Run tokens transformation:

`npx figma-tokens-transformer transform`

You can also add the script to your `package.json` scripts:

`"transform-tokens": "figma-tokens-transformer transform"`

thanks to that you can call the script like so:

`npm run transform-tokens`

## Configuration

It is recommended to configure the tool using the CLI wizard:

`npx figma-tokens-transformer configure`

However, it can be also done by hand - config files format
is shown in the examples below.

*tokens-transformer.config.json* (Ant Design v4)
```json
{
  "source": {
    "tokensFile": "src/tokens/tokens.json"
  },
  "target": {
    "lessDir": "src/less"
  }
}
```

*tokens-transformer.config.json* (Ant Design v5)
```json
{
  "version": 5,
  "source": {
    "tokensFile": "src/tokens/tokens.json"
  },
  "target": {
    "jsonsDir": "src/ant-tokens"
  }
}
```

*tokens-transformer.secret.json*
(**do not commit this file!**)
```json
{
  "license": {
    "key": "6X2EF5E7-X96348A0-8871CEX3-A93XB7X9",
    "email": "test@example.com"
  }
}
```

### CI
For continuous integration build purposes
environment variables should be used to avoid keeping
sensitive data (license) in the repository.

Available variables are:
- SOURCE_FILE
- TARGET_DIR
- LICENSE_KEY
- LICENSE_EMAIL