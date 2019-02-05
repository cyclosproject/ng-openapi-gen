#!/usr/bin/env node
"use strict";
// Run the main function
const runNgOpenApiGen = require('./ng-openapi-gen').runNgOpenApiGen;
runNgOpenApiGen()
  .catch(err => console.error(`Error on API generation: ${err}`));
