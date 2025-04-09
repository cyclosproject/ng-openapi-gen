
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

  /** Typescript file, without '.ts' extension that exports all functions. Set to false to skip. Defaults to `functions`. */
  functionIndex?: string | boolean;

  /** Typescript file, without '.ts' extension that exports all services. Set to false to skip. Defaults to `services`. */
  serviceIndex?: string | boolean;

  /** When true, an 'index.ts' file will be generated, exporting all generated files */
  indexFile?: boolean;

  /** When false, no services will be generated (clients will use functions directly) */
  services?: boolean;

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

  /** Name for the service to call functions directly. Defaults to 'ApiService'. */
  apiService?: string;

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
   * - `upper` for an enum with UPPER_CASE names;
   * - `pascal` for enum PascalCase names;
   * - `ignorecase` for enum names that ignore character casing;
   *
   * Defaults to 'pascal'.
   */
  enumStyle?: 'alias' | 'upper' | 'pascal' | 'ignorecase';

  /**
   * Should an array with all enum items of models be exported in a sibling file for enums?
   */
  enumArray?: boolean;

  /**
   * Determines how to normalize line endings. Possible values are:
   *
   * - `crlf`: normalize line endings to CRLF (Windows, DOS) => \r\n
   * - `lf` normalize line endings to LF (Unix, OS X) => \n
   * - `cr` normalize line endings to CR (Mac OS) => \r
   * - `auto` normalize line endings for the current operating system
   *
   * Defaults to 'auto'.
   */
  endOfLineStyle?: 'crlf' | 'lf' | 'cr' | 'auto';

  /** Custom templates directory. Any `.handlebars` files here will be used instead of the corresponding default. */
  templates?: string;

  /** When specified, filters the generated services, excluding any param corresponding to this list of params. */
  excludeParameters?: string[];

  /** When specified, does not generate a $Json suffix. */
  skipJsonSuffix?: boolean;

  customizedResponseType?: {
    [key: string]: {
      toUse: 'arraybuffer' | 'blob' | 'json' | 'document';
    };
  };

  /** When specified, will create temporary files in system temporary folder instead of next to output folder. */
  useTempDir?: boolean;

  /** When true, no verbose output will be displayed */
  silent?: boolean;

  /** When true (default) models names will be camelized, besides having the first letter capitalized. Setting to false will prevent camelizing. */
  camelizeModelNames?: boolean;

  /** List of paths to early exclude from the processing */
  excludePaths?: string[];

  /**
   * When true, the expected response type in the request method names are not abbreviated and all response variants are kept.
   * Default is false.
   * When array is given, `mediaType` is expected to be a RegExp string matching the response media type. The first match in the array
   * will decide whether or how to shorten the media type. If no mediaType is given, it will always match.
   *
   * 'short':     application/x-spring-data-compact+json    ->    getEntities$Json
   * 'tail':      application/x-spring-data-compact+json    ->    getEntities$XSpringDataCompactJson
   * 'full':      application/x-spring-data-compact+json    ->    getEntities$ApplicationXSpringDataCompactJson
   */
  keepFullResponseMediaType?: boolean | Array<{ mediaType?: string; use: 'full' | 'tail' | 'short' }>;
}
