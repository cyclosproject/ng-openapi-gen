import { ArgumentParser } from 'argparse';
import pkg from '../package.json';
import schema from '../ng-openapi-gen-schema.json';
import { Options } from './options.js';
import fs from 'fs';
import { kebabCase } from 'lodash';

const DefaultConfig = 'ng-openapi-gen.json';

function createParser() {
  const argParser = new ArgumentParser({
    version: pkg.version,
    addHelp: true,
    description: `
Generator for API clients described with OpenAPI 3.0 specification for
Angular 6+ projects. Requires a configuration file, which defaults to
${DefaultConfig} in the current directory. The file can also be
specified using '--config <file>'.
All settings in the configuration file can be overridding by setting the
corresponding argument in the command-line. For example, to specify a
custom suffix for service classes via command-line, pass the command-line
argument '--serviceSuffix Suffix'. Kebab-case is also accepted, so, the same
argument could be set as '--service-suffix Suffix'
As the only required argument is the input for OpenAPI specification,
a configuration file is only required if no --input argument is set.`.trim()
  });
  argParser.addArgument(
    ['-c', '--config'],
    {
      help: `
The configuration file to be used. If not specified, assumes that
${DefaultConfig} in the current directory`.trim(),
      dest: 'config',
      defaultValue: `./${DefaultConfig}`
    }
  );
  const props = schema.properties;
  for (const key of Object.keys(props)) {
    if (key === '$schema') {
      continue;
    }
    const kebab = kebabCase(key);
    const desc = (props as any)[key];
    const names = ['--' + key];
    if (kebab !== key) {
      names.push('--' + kebab);
    }
    argParser.addArgument(names, {
      help: desc.description,
      dest: key
    });
  }
  return argParser;
}

/**
 * Parses the options from command-line arguments
 */
export function parseOptions(sysArgs?: string[]): Options {
  const argParser = createParser();
  const args = argParser.parseArgs(sysArgs);
  let options: any = {};
  if (args.config) {
    options = JSON.parse(fs.readFileSync(args.config, { encoding: 'utf-8' }));
  }
  const props = schema.properties;
  for (const key of Object.keys(args)) {
    let value = args[key];
    if (key === 'config' || value == null) {
      // This is the only option that is not from the configuration itself, or not passed in
      continue;
    }
    const desc = (props as any)[key];
    if (desc.type === 'array') {
      value = (value || '').trim().split(',').map((v: string) => v.trim());
    } else if (value === 'true') {
      value = true;
    } else if (value === 'false') {
      value = false;
    }
    if (value !== undefined) {
      options[key] = value;
    }
  }
  if (options.input == undefined || options.input === '') {
    throw new Error('No input (OpenAPI specification) defined');
  }
  return options;
}

