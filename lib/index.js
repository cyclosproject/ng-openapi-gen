#!/usr/bin/env node
"use strict";
const tsNode = require('ts-node');
tsNode.register({
  project: `${__dirname}/../tsconfig.json`,
  transpileOnly: true
});

// Run the main function
const runNgOpenApiGen = require('./ng-openapi-gen').runNgOpenApiGen;
runNgOpenApiGen()
  .catch(err => console.error(`Error on API generation: ${err}`));
