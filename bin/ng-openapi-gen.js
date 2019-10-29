#!/usr/bin/env node

const { runNgOpenApiGen } = require('../lib/ng-openapi-gen');

// Run the main function
runNgOpenApiGen()
  .catch(err => console.error(`Error on API generation: ${err}`));
