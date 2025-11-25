ng-openapi-gen: An OpenAPI 3.0 and 3.1 code generator for Angular
---

![Build status](https://github.com/cyclosproject/ng-openapi-gen/workflows/build/badge.svg)

This project is a NPM module that generates model interfaces and web service clients from an [OpenApi 3.0 or 3.1](https://www.openapis.org/)
[specification](https://github.com/OAI/OpenAPI-Specification). The generated classes follow the principles of [Angular](https://angular.io/).
The generated code is compatible with Angular 16+. Support for OpenAPI 3.1 was added since ng-openapi-gen 1.0.

For a generator for [Swagger / OpenAPI 2.0](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md), use the
[ng-swagger-gen](https://github.com/cyclosproject/ng-swagger-gen) instead. Note that ng-swagger-gen has been unmaintained for quite a long time.

## Highlights

- Easy to use and to integrate with Angular CLI;
- Supports OpenAPI 3.0 and 3.1 specifications in both `JSON` and `YAML` formats;
- Each OpenAPI path is mapped to a function. Those functions are invoked using a generated `@Injectable` service;
  - Alternatively, it is possible to generate an `@Injectable` service per tag. This has a bit cleaner API at expense of extra bundle size;
- Supports both `Promise` (default) and `Observable` as result types for services;
- Allows accessing the original `HttpResponse`, for example, to read headers;
  - This is achieved by generating a variant suffixed with `$Response` on services;
- `OpenAPI` supports combinations of request body and response content types. For each combination, a distinct function is generated;
- It is possible to specify a subset of functions / models to generate.
  - Think of this not for saving on bundle size, as tree-shaking includes only used functions / models, but to have a cleaner library;
- It is possible to specify a custom root URL for the web service endpoints;
- Generated files should compile using strict TypeScript compiler flags, such as `noUnusedLocals` and `noUnusedParameters`.

## Limitations

- Only standard OpenAPI 3.0 / 3.1 descriptions will be generated;
  - However, ng-openapi-gen supports a few [vendor extensions](#supported-vendor-extensions);
- Servers per operation are not supported;
- Only the first server is used as a default root URL in the configuration;
- No data transformation is ever performed before sending / after returning data;
  - This means that a property of type `string` and format `date-time` will always be generated as `string`, not `Date`.
    Otherwise every API call would need to have a processing that would traverse the returned object graph before sending the request
    to replace all date properties by `Date`. The same applies to sent requests. Such operations are out of scope for `ng-openapi-gen`;

## Migrating from previous versions to 1.0+

Starting with version 1.0, ng-openapi-gen has updated some default configuration options to better align with current standards. These are
the settings that have changed:

- `"module": false`: Previously, the default was `ApiModule`. `NgModule`s are no longer needed since standalone components were introduced
  in Angular 14. All generated `@Injectable` classes are provided in root module, so we don't need another one.
- `"services": false`: Previously, the default was `true`. For some time already, ng-openapi-gen has generated functions for each API
  operation, and services (one per API tag) are just wrappers around those functions. As services reference all functions, for larger APIs,
  the bundle size is impacted, because the code for handling all functions in the tag will be bundled, even when using a single one.
- `"apiService": "Api"`. Previously empty, the `Api` service was not generated, because the default was to use a service per tag. But
  now we need it to invoke the generated API functions.
- `"enumStyle": "alias"`. Previously, the default was `pascal`. With this change, by default we'll no longer generate TypeScript `enum`.
  Instead, a type is defined with an union of possible values. All other options end up generating a TypeScript `enum`, which emit a
  JavaScript class, taking up space in the bundle size.
- `"enumArray": true`. The major drawback of `enumStyle: alias` is there's no way to iterate all existing values. With `enumArray` we
  generate a sibling `.ts` file which exports an array (of the correct enum type) with all items on it.
- `"promises": true`: By default, generated services return `Promise`s, not `Observable`s. If you prefer to keep working with `Observable`s,
  set `"promises": false`.

So, if you're upgrading from previous versions and want the generation to be similar, set all these settings in your configuration with
their corresponding previous values.

## Installing and running

You may want to install `ng-openapi-gen` globally or just on your project. Here is an example for a global setup:

```bash
$ npm install -g ng-openapi-gen
$ ng-openapi-gen --input my-api.yaml --output my-app/src/app/api
```

Alternatively you can use the generator directly from within your build-script:

```typescript
import $RefParser from 'json-schema-ref-parser';
import { NgOpenApiGen } from 'ng-openapi-gen';

const options = {
  input: "my-api.json",
  output: "my-app/src/app/api",
}

// load the openapi-spec and resolve all $refs
const RefParser = new $RefParser();
const openApi = await RefParser.bundle(options.input, {
  dereference: { circular: false }
});

const ngOpenGen = new NgOpenApiGen(openApi, options);
ngOpenGen.generate();
```

This will expect the file `my-api.yaml` (or `my-api.json`) to be in the current directory, and will generate files on `my-app/src/app/api`.

## Configuration file and CLI arguments

If the file `ng-openapi-gen.json` exists in the current directory, it will be read. Alternatively, you can run
`ng-openapi-gen --config my-config.json` (could also be `-c`) to specify a different configuration file, or even specify the input / output
as `ng-openapi-gen -i input.yaml` or `ng-openapi-gen -i input.yaml -o /tmp/generation`. The only required configuration property is `input`,
which specified the `OpenAPI` specification file. The default `output` is `src/app/api`.

You can even generate code for multiple APIs in a single project, each with its own configuration file. In this case you'll also probably
want to customize names, like having a different `configuration` and `apiService` for each API.

For a list with all possible configuration options, see the
[JSON schema file](https://raw.githubusercontent.com/cyclosproject/ng-openapi-gen/master/ng-openapi-gen-schema.json).
You can also run `ng-openapi-gen --help` to see all available options.
Each option in the JSON schema can be passed in as a CLI argument, both in camel case, like `--includeTags tag1,tag2,tag3`, or in kebab
case, like `--exclude-tags tag1,tag2,tag3`.

Here is an example of a configuration file:

```json
{
  "$schema": "node_modules/ng-openapi-gen/ng-openapi-gen-schema.json",
  "input": "my-file.json",
  "output": "my-app/src/app/api",
  "ignoreUnusedModels": false
}
```

## Using functional API calls

`ng-openapi-gen` generates a function with the implementation of each actual API call. By default since version 1.0, services per API tag
are not generated. To use these functions, a generated @Injectable `Api` is provided. This name can be changed with the `apiService`
configuration. Here is an example:

```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Api } from './api/api';
import { getResults } from './api/fn/operations/get-results';
import { Result } from './api/models';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly results = signal<Result[] | null>(null);

  private api = inject(Api);

  async ngOnInit() {
    this.results.set(await this.api.invoke(getResults, { limit: 5 }));
  }
}
```

Alternatively, ng-openapi-gen can be configured to generate services for each API tag. This was the default before version 1.0. Services
provide a slightly cleaner API, at expense of additional bundle size. For larger APIs, suppose your tag has 50 operations and you inject
the service in a component, with functions, only the corresponding function will be bundled together with the component code. However, if
it injects a service, all 50 functions will be bundled. You can set the `"services": true` configuration option, and use it like this:

```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Result } from './api/models';
import { ResultsService } from './api/services';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly results = signal<Result[] | null>(null);

  private resultsService = inject(ResultsService);

  async ngOnInit() {
    this.results.set(await this.resultsService.getResults({ limit: 5 }));
  }
}
```

Notice there are minimal cosmetic improvements, at expense of extra bundle sizes, especially for large APIs.

## Specifying the root URL / web service endpoint

By default, the server specified in the OpenAPI specification is used as root URL for API paths. However, it is a common requirement to configure this from the application. These are the possible ways to achieve this (note that the `ApiConfiguration` class can be renamed with the `configuration` setting):

1. Starting with version 1.0.5, in you application providers list, add a provider for your `ApiConfiguration` class, like this:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideApiConfiguration } from './api/api-configuration';

export const appConfig: ApplicationConfig = {
  providers: [
    // ...other providers...
    provideApiConfiguration('http://localhost:3000/api')
  ]
};
```

2. Inject the `ApiConfiguration` instance in your bootstrap component and set it directly:

```typescript
import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiConfiguration } from './api/api-configuration';
import { Result } from './api/models';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly results = signal<Result[] | null>(null);

  private apiConfiguration = inject(ApiConfiguration);

  async ngOnInit() {
    this.apiConfiguration.rootUrl = 'http://localhost:3000/api';
  }
}
```

3. Alternatively, if you generate an `NgModule` by setting the `module` configuration (which isn't recommended since Angular's standalone components, and is disabled in ng-openapi-gen by default), you can use its `.forRoot({ rootUrl: 'http://localhost:3000/api'})` method when importing the module. However, this is only kept for historical reasons, and might be removed in the future.

## Passing request headers / customizing the request

To pass request headers, such as authorization or API keys, as well as having a centralized error handling, a standard
[interceptor](https://angular.dev/guide/http/interceptors) should be used. Here is an example of a functional interceptor:

```typescript
import { HttpInterceptorFn } from '@angular/common/http';

export const API_INTERCEPTOR: HttpInterceptorFn = (req, next) => {
  console.log('Intercepted request:', req);
  return next(req);
};
```

Then, use it in your `app.config.ts`:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { API_INTERCEPTOR } from './api-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... others
    provideHttpClient(withInterceptors([API_INTERCEPTOR])),
  ],
};
```

## Setting up a node script

It is not a good practice to have generated code committed to the source control system (such as git). The only exception, is for projects
using a third party API definition that never changes, in which ng-openapi-gen is expected to run only once. To ignore the generator output
folder to in GIT, assuming the default output folder `src/app/api`, create the `src/app/.gitignore` file, with a line being `api`.

If you use an API definition that can change, setup an NPM script to ensure that whenever your project is started or built, the generated
files are consistent with the API definition. To do so, create the `ng-openapi-gen.json` configuration file and add the following
`scripts` to your `package.json`:

```json
{
  "scripts": {
    "generate:api": "ng-openapi-gen",
    "start": "npm run generate:api && npm run ng -- serve",
    "build": "npm run generate:api && npm run ng -- build -prod"
  }
}
```

This way whenever you run `npm start` or `npm run build`, the API classes will be re-generated.

Also, if you use several configuration files, you can specify multiple times the call to `ng-openapi-gen`, like:
```json
{
  "scripts": {
    "generate:api": "npm run generate:api:a && npm run generate:api:b",
    "generate.api:a": "ng-openapi-gen -c api-a.json",
    "generate.api:b": "ng-openapi-gen -c api-b.json",
    "start": "npm run generate:api && npm run ng -- serve",
    "build": "npm run generate:api && npm run ng -- build -prod"
  }
}
```

## Supported vendor extensions

Besides the OpenAPI 3 specification, the following vendor extensions are supported:

- `x-operation-name`: Defined in [LoopBack](https://loopback.io/doc/en/lb4/Decorators_openapi.html), this extension can be used in
  operations to specify the actual method name. The `operationId` is required to be unique among all tags, but with this extension,
  a shorter method name can be used per tag (service). Example:

```yaml
paths:
  /users:
    get:
      tags:
        - Users
      operationId: listUsers
      x-operation-name: list
      # ...
  /places:
    get:
      tags:
        - Places
      operationId: listPlaces
      x-operation-name: list
      # ...
```

- `x-enumNames`: Generated by [NSwag](https://github.com/RicoSuter/NSwag), this extension allows schemas which are enumerations to customize
  the enum names. It must be an array with the same length as the actual enum values. Example:

```yaml
components:
  schemas:
    HttpStatusCode:
      type: integer
      enum:
        - 200
        - 404
        - 500
      x-enumNames:
        - OK
        - NOT_FOUND
        - INTERNAL_SERVER_ERROR
```

## Customizing templates

You can customize the Handlebars templates by copying the desired files from the
[templates](https://github.com/cyclosproject/ng-openapi-gen/tree/master/templates) folder (only the ones you need to customize) to some
folder in your project, and then reference it in the configuration file.

For example, to make objects extend a base interface, copy the
[object.handlebars](https://github.com/cyclosproject/ng-openapi-gen/tree/master/templates) file to your `src/templates` folder. Then, in
`ng-openapi-gen.json` file, set the following: `"templates": "src/templates"`. Finally, the customized `src/templates/object.handlebars`
would look like the following (based on the 1.0 version, subject to change in the future):

```handlebars
import { MyBaseModel} from 'src/app/my-base-model';

export interface {{typeName}} extends MyBaseModel {
{{#properties}}
{{{tsComments}}}{{{identifier}}}{{^required}}?{{/required}}: {{{type}}};
{{/properties}}
{{#additionalPropertiesType}}

  [key: string]: {{{.}}};
{{/additionalPropertiesType}}
}
```

## Custom Handlebars helpers

You can integrate your own Handlebar helpers for custom templates. To do so simply provide a `handlebars.js` file in the same directory as
your templates that exports a function that receives the Handlebars instance that will be used when generating the code from your templates.

```js
module.exports = function(handlebars) {
  // Adding a custom handlebars helper: loud
  handlebars.registerHelper('loud', function (aString) {
    return aString.toUpperCase()
  });
};
```

## Developing and contributing

The generator itself is written in TypeScript. When building, the code is transpiled to JavaScript in the `dist` folder. And the `dist`
folder is the one that gets published to NPM. Even to prevent publishing from the wrong path, the `package.json` file has `"private": true`,
which gets replaced by `false` in the build process.

The tests, on the other hand, run on vitest and run directly from TypeScript.

After developing the changes, to `link` the module and test it with other node projects, run the following:

```bash
npm run build
cd dist
npm link
```

At that point, the globally available ng-openapi-gen will be the one compiled to the `dist` folder.
