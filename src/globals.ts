import { Options } from './options';
import { typeName, fileName } from './gen-utils';

/**
 * Stores the global variables used on generation
 */
export class Globals {

  prefix: string;
  moduleClass: string;
  moduleFile: string;
  configurationClass: string;
  configurationFile: string;

  constructor(options: Options) {
    // Calculate the globally used names
    this.prefix = options.prefix || 'Api';
    this.moduleClass = typeName(this.prefix + 'Module');
    // Angular's best practices demands xxx.module.ts, not xxx-module.ts
    this.moduleFile = fileName(this.moduleClass).replace(/\-module$/, '.module');
    this.configurationClass = typeName(this.prefix + 'Configuration');
    this.configurationFile = fileName(this.configurationClass);
  }

}