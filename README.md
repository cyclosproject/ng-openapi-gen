ng-openapi-gen: An OpenAPI 3 code generator for Angular
---

This project is a NPM module that generates model interfaces and web service clients from an [OpenApi 3](https://www.openapis.org/) [specification](https://github.com/OAI/OpenAPI-Specification).
The generated classes follow the principles of [Angular](https://angular.io/).
The generated code is compatible with Angular 6+.

For a generator for [Swagger 2.0](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md), use [ng-swagger-gen](https://github.com/cyclosproject/ng-swagger-gen) instead.

`ng-openapi-gen` is still in early development stage, and is not yet recommended for production.

## Highlights

- It should be easy to use and to integrate with Angular CLI;
- It should support `OpenAPI` specifications in both `JSON` and `YAML` formats;
- Each tag in the OpenAPI specification generates an Angular `@Injectable()` service;
- An Angular `@NgModule()` is generated, which provides all services;
- It should be easy to access the original `HttpResponse`, for example, to read headers.
  This is achieved by generating a variant suffixed with `$Response` for each generated method;
- `OpenAPI` supports combinations of request body and response content types.
  For each combination, a distinct method is generated;
- It should be possible to specify a subset of services to generate.
  Only the models actually used by that subset should be generated;
- It should be easy to specify a root URL for the web service endpoints;
- Generated files should compile using strict `TypeScript` compiler flags, such as `noUnusedLocals` and `noUnusedParameters`.

## Limitations

- Only standard OpenAPI 3 descriptions will be generated. `ng-swagger-gen` allows several extensions, specially types from JSON schema, but they are out of scope for `ng-openapi-gen`;
- Servers per operation are not supported;
- Only the first server is used as a default root URL in the configuration;
- No data transformation is ever performed before sending / after returning data.
  This means that a property of type `string` and format `date-time` will always be generated as `string`.
  Otherwise every API call would need to have a processing that would traverse the returned object graph before sending the request
  to replace all date properties by `Date`. The same applies to sent requests. Such operations are out of scope for `ng-openapi-gen`;

## Relationship with ng-swagger-gen

This project uses the same philosophy as [ng-swagger-gen](https://github.com/cyclosproject/ng-swagger-gen), and was built by the same team.
We've learned a lot with `ng-swagger-gen` and have applied all the acuired knowledge to build `ng-openapi-gen`.

There were several reasons to not build a new major version of `ng-swagger-gen` that supports `OpenAPI 3`, but instead,
to create a new project.
The main differences between `ng-openapi-gen` and `ng-swagger-gen` are:

- The first, more obvious and more important is the specification version, `OpenAPI 3` vs `Swagger 2`;
- The generator itself is written in `TypeScript`, which should be easier to maintain;
- There is a test suite for the generator;
- The command-line arguments are more robust, derived directly from the `JSON schema` definition for the configuration file, easily
  allowing to override any specific configuration on CLI.
- Root enumerations (schemas of `type` = `string` | `number` | `integer`) can be generated as TypeScript's `enum`'s.
This is enabled by default. Inline enums are not, because it would require another type to be exported in the container type.

## Installing and running

You may want to install `ng-openapi-gen` globally or just on your project. Here is an example for a global setup:

```bash
$ npm install -g ng-openapi-gen
$ ng-openapi-gen --input my-api.yaml --output my-app/src/app/api
```

This will expect the file `my-api.yaml` to be in the current directory, and will generate the files on `my-app/src/app/api`.

## Configuration file and CLI arguments

If the file `ng-openapi-gen.json` exists in the current directory, it will be read. Alternatively, you can run `ng-openapi-gen --config my-config.json` to specify a different configuration file.
The only required configuration property is `input`, which specified the `OpenAPI` specification file. The default `output` is `src/app/api`.

For a list with all possible configuration options, see the [JSON schema file](https://raw.githubusercontent.com/cyclosproject/ng-openapi-gen/master/ng-openapi-gen-schema.json).
You can also run `ng-openapi-gen --help` to see all available options.
Each option in the JSON schema can be passed in as a CLI argument, both in camel case, like `--includeTags tag1,tag2,tag3`, or in kebab case, like `--exclude-tags tag1,tag2,tag3`.

Here is an example of a configuration file:

```json
{
  "$schema": "node_modules/ng-openapi-gen/ng-openapi-gen-schema.json",
  "input": "my-file.json",
  "output": "out/person-place",
  "ignoreUnusedModels": false
}
```