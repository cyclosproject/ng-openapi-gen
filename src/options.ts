
/** Options used by ng-openapi-gen */
export interface Options {

  /** The input file or URL to the OpenAPI 3 specification, JSON or YAML, local file or URL */
  input: string;

  /** Where generated files will be written to. Defaults to 'src/app/api'. */
  output?: string;

  /** A prefix to the generated global classes, such as `Configuration` and `Module`. Defaults to 'Api', so the default generated files are `ApiConfiguration` and `ApiModule`. */
  prefix?: string;

  /** Tag name assumed for operations without tags. Defaults to the value of 'prefix', which defaults to 'Api'. */
  defaultTag?: string;

  /** Specific tags to be included */
  includeTags?: string[];

  /** Specific tags to be excluded */
  excludeTags?: string[];

  /** Whether to skip models without references to them */
  ignoreUnusedModels?: boolean;

  /** Whether to remove unexpected files in the output directory */
  removeStaleFiles?: boolean;

  /** File name file that exports all models. Set to false to skip. Defaults to `models.ts`. */
  modelIndex?: string | boolean;

  /** File file that exports all services. Set to false to skip. Defaults to `services.ts`. */
  serviceIndex?: string | boolean;

  /** Prefix for generated service classes. Defaults to empty. */
  servicePrefix?: string;

  /** Suffix for generated service classes. Defaults to 'Service'. */
  serviceSuffix?: string;

  /** Prefix for generated model classes. Defaults to empty. */
  modelPrefix?: string;

  /** Suffix for generated model classes. Defaults to empty. */
  modelSuffix?: string;

  /** Whether to generate the module which provides all services */
  apiModule?: boolean;

  /** Custom templates directory. Any `.mustache` files here will be used instead of the corresponding default. */
  templates?: string;

}
