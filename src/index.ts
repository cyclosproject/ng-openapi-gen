import $RefParser from 'json-schema-ref-parser';
import { OpenAPIObject } from 'openapi3-ts';
import { Options } from './options';
import { NgOpenApiGen } from './ng-openapi-gen';

/**
 * Reads the options from the command line / configuration file
 */
function readOptions(): Options {
  return {
    input: 'test/all-operations.json',
    output: 'out/all-operations'
  };
}

/**
 * Main generator function.
 */
async function ngOpenApiGen() {
  const options = readOptions();
  const refParser = new $RefParser();
  const input = options.input;
  try {
    const openApi = await refParser.bundle(input, { dereference: { circular: false } }) as OpenAPIObject;
    const gen = new NgOpenApiGen(openApi, options);
    gen.generate();
  } catch (err) {
    console.error(`Error on generation from ${input}: ${err}`);
  }
}

// Run the main function
ngOpenApiGen()
  .catch(err => console.error(`Error on generation from: ${err}`));
