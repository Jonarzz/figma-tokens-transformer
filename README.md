# Ant for Figma tokens transformer
Tool transforming Ant Design for Figma tokens to less files.

1. Add the dependency:

`npm install figma-tokens-transformer --save-dev`

2. Create the configuration file using CLI wizard:

`npx figma-tokens-transformer configure`

Remember to add the generated file to `.gitignore` as it contains
sensitive data (license key).

3. Run tokens transformation:

`npx figma-tokens-transformer transform`

You can also add the script to your `package.json` scripts:

`"transform-tokens": "figma-tokens-transformer transform"`

thanks to that you can call the script like so:

`npm run transform-tokens`
