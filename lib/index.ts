#!/usr/bin/env node

import { runNgOpenApiGen } from './ng-openapi-gen';

// Run the main function
runNgOpenApiGen()
  .catch(err => console.error(`Error on API generation: ${err}`));

