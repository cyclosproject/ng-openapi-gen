
/** Options used by ng-openapi-gen */
export interface Options {

  /** The input file or URL to the OpenAPI 3 specification, JSON or YAML, local file or URL */
  input: string;

  /** Where generated files will be written to. Defaults to 'src/app/api'. */
  output?: string;

  /** Tag name assumed for operations without tags. Defaults to the value of 'prefix', which defaults to 'Api'. */
  defaultTag?: string;

  /** Indicates the timeout when fetching the input URL, in milliseconds. Defaults to 20 seconds (20000). */
  fetchTimeout?: number;

  /** Specific tags to be included */
  includeTags?: string[];

  /** Specific tags to be excluded */
  excludeTags?: string[];

  /** Whether to skip models without references to them */
  ignoreUnusedModels?: boolean;

  /** Whether to remove unexpected files in the output directory */
  removeStaleFiles?: boolean;

  /** Typescript file, without '.ts' extension that exports all models. Set to false to skip. Defaults to `models`. */
  modelIndex?: string | boolean;

  /** Typescript file, without '.ts' extension that exports all services. Set to false to skip. Defaults to `services`. */
  serviceIndex?: string | boolean;

  /** When true, an 'index.ts' file will be generated, exporting all generated files */
  indexFile?: boolean;

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

  /** Name for the configuration class to generate. Defaults to 'ApiConfiguration'. */
  configuration?: string;

  /** Name for the base service class to generate. Defaults to 'BaseService'. */
  baseService?: string;

  /** Name for the request builder class to generate. Defaults to 'RequestBuilder'. */
  requestBuilder?: string;

  /** Name for the response class to generate. Defaults to 'StrictHttpResponse'. */
  response?: string;

  /** Class name of the module that provides all services. Set to false to skip. Defaults to `ApiModule`. */
  module?: string | boolean;

  /**
   * Determines how root enums will be generated. Possible values are:
   *
   * - `alias`: just generate a type alias with the possible values;
   * - `upper` for an enum with UPPER_CASE names, and;
   * - `pascal` for enum PascalCase names.
   *
   * Defaults to 'pascal'.
   */
  enumStyle?: 'alias' | 'upper' | 'pascal';

  /** Custom templates directory. Any `.handlebars` files here will be used instead of the corresponding default. */
  templates?: string;

  /** When specified, filters the generated services, excluding any param corresponding to this list of params. */
  excludeParameters?: string[];

  /** When specified, does not generate a $Json suffix. */
  skipJsonSuffix?: boolean;
}
