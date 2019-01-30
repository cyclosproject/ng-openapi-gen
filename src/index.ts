#!/usr/bin/env node

import $RefParser from 'json-schema-ref-parser';
import { OpenAPIObject } from 'openapi3-ts';
import { parseOptions } from './cmd-args';
import { NgOpenApiGen } from './ng-openapi-gen';

/**
 * Main generator function.
 */
async function ngOpenApiGen() {
  const options = parseOptions();
  const refParser = new $RefParser();
  const input = options.input;
  try {
    const openApi = await refParser.bundle(input, { dereference: { circular: false } }) as OpenAPIObject;
    const gen = new NgOpenApiGen(openApi, options);
    gen.generate();
  } catch (err) {
    console.error(`Error on API generation from ${input}: ${err}`);
  }
}

// Run the main function
ngOpenApiGen()
  .catch(err => console.error(`Error on API generation: ${err}`));
