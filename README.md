ng-openapi-gen: An OpenAPI 3 code generator for Angular
---

![Build status](https://github.com/cyclosproject/ng-openapi-gen/workflows/build/badge.svg)
![Test status](https://github.com/cyclosproject/ng-openapi-gen/workflows/test/badge.svg)

This project is a NPM module that generates model interfaces and web service clients from an [OpenApi 3](https://www.openapis.org/) [specification](https://github.com/OAI/OpenAPI-Specification).
The generated classes follow the principles of [Angular](https://angular.io/).
The generated code is compatible with Angular 12+.

For a generator for [Swagger 2.0](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/2.0.md), use [ng-swagger-gen](https://github.com/cyclosproject/ng-swagger-gen) instead.

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
- Generated files should compile using strict `TypeScript` compiler flags, such as `noUnusedLocals` and `noUnusedParameters`;
- For large APIs it is possible to generate only functions for each API operation, and not entire services. This allows for tree-shakable code to be generated, resulting in lower bundle sizes.

## Limitations

- Only standard OpenAPI 3 descriptions will be generated. `ng-swagger-gen` allows several extensions, specially types from JSON schema, but they are out of scope for `ng-openapi-gen`. There is, however, support for a few [vendor extensions](#supported-vendor-extensions);
- Servers per operation are not supported;
- Only the first server is used as a default root URL in the configuration;
- No data transformation is ever performed before sending / after returning data.
  This means that a property of type `string` and format `date-time` will always be generated as `string`, not `Date`.
  Otherwise every API call would need to have a processing that would traverse the returned object graph before sending the request
  to replace all date properties by `Date`. The same applies to sent requests. Such operations are out of scope for `ng-openapi-gen`;

## Relationship with ng-swagger-gen

This project uses the same philosophy as [ng-swagger-gen](https://github.com/cyclosproject/ng-swagger-gen), and was built by the same team.
We've learned a lot with `ng-swagger-gen` and have applied all the acquired knowledge to build `ng-openapi-gen`.

There were several reasons to not build a new major version of `ng-swagger-gen` that supports `OpenAPI 3`, but instead, to create a new project.
The main differences between `ng-openapi-gen` and `ng-swagger-gen` are:

- The first, more obvious and more important is the specification version, `OpenAPI 3` vs `Swagger 2`;
- The generator itself is written in `TypeScript`, which should be easier to maintain;
- There is an extensive test suite for the generator;
- The command-line arguments are more robust, derived directly from the `JSON schema` definition for the configuration file, easily allowing to override any specific configuration on CLI.
- Root enumerations (schemas of `type` = `string` | `number` | `integer`) can be generated as TypeScript's `enum`'s.
This is enabled by default. Inline enums are not, because it would require another type to be exported in the container type.

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

This will expect the file `my-api.yaml` (or `my-api.json`) to be in the current directory, and will generate the files on `my-app/src/app/api`.

## Configuration file and CLI arguments

If the file `ng-openapi-gen.json` exists in the current directory, it will be read. Alternatively, you can run `ng-openapi-gen --config my-config.json` (could also be `-c`) to specify a different configuration file, or even specify the input / output as `ng-openapi-gen -i input.yaml` or `ng-openapi-gen -i input.yaml -o /tmp/generation`.
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

## Specifying the root URL / web service endpoint

The easiest way to specify a custom root URL (web service endpoint URL) is to
use `forRoot` method of `ApiModule` and set the `rootUrl` property from there.

```typescript
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    HttpClientModule,
    ApiModule.forRoot({ rootUrl: 'https://www.example.com/api' }),
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule { }
```

Alternatively, you can inject the `ApiConfiguration` instance in some service
or component, such as the `AppComponent` and set the `rootUrl` property there.

## Using functional API calls

Starting with version 0.50.0, `ng-openapi-gen` generates a function with the implementation of each actual API call.
The generated services delegate to such functions.

However, it is possible to disable the entire services generation, which will avoid the need to include all such services in the application.
As a result, the application will be more tree-shakable, resulting in smaller bundle sizes.
This is specially true for large 3rd party APIs, in which, for example, a single service (OpenAPI tag) has many methods, but only a few are actually used.
Combined with the option `"enumStyle": "alias"`, the footprint of the API generation will be minimal.

Each generated function receives the following arguments:

- Angular's `HttpClient` instance;
- The API `rootUrl` (the operation knowns the relative URL, and will use this root URL to build the full endpoint path);
- The actual operation parameters. If it has no parameters or all parameters are optional, the params option will be optional as well;
- The optional http context.

Clients can directly call the function providing the given parameters.
However, to make the process smoother, it is also possible to generate a general service specifically to invoke such functions.
Its generation is disabled by default, but can be enabled by setting the option `"apiService": "ApiService"` (or another name your prefer).
With this, a single `@Injectable` service is generated. It will provide the functions with the `HttpClient` and `rootUrl` (from `ApiConfiguration`).

It then provides 2 methods for invoking the functions:

- `invoke`: Calls the function and returns the response body;
- `invoke$Response`: Calls the function and returns the entire response, so additional metadata can be read, such as status code or headers.

Here is an example class using the `ApiService`:

```typescript
import { Directive, OnInit, inject } from '@angular/core';
import { ApiService } from 'src/api/api.service';
import { getResults } from 'src/api/fn/api/get-results';
import { Result } from 'src/api/models';
import { Observable } from 'rxjs';

@Directive()
export class ApiFnComponent implements OnInit {
  results$!: Observable<Result[]>;

  apiService = inject(ApiService);

  ngOnInit() {
    // getResults is the operation function. The second argument is the actual parameters passed to the function
    this.results$ = this.apiService.invoke(getResults, { limit: 10 });
  }
}
```

## Passing request headers / customizing the request

To pass request headers, such as authorization or API keys, as well as having a
centralized error handling, a standard
[HttpInterceptor](https://angular.io/guide/http#intercepting-all-requests-or-responses) should
be used. It is basically an `@Injectable` that is called before each request,
and can customize both requests and responses.

Here is an example:

```typescript
@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Apply the headers
    req = req.clone({
      setHeaders: {
        'ApiToken': '1234567890'
      }
    });

    // Also handle errors globally
    return next.handle(req).pipe(
      tap(x => x, err => {
        // Handle this err
        console.error(`Error performing request, status code = ${err.status}`);
      })
    );
  }
}
```

Then, both the `HttpInterceptor` implementation and the injection token
`HTTP_INTERCEPTORS` pointing to it must be provided in your application module,
like this:

```typescript
import { NgModule, Provider, forwardRef } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { ApiInterceptor } from './api.interceptor';

export const API_INTERCEPTOR_PROVIDER: Provider = {
  provide: HTTP_INTERCEPTORS,
  useExisting: forwardRef(() => ApiInterceptor),
  multi: true
};

@NgModule({
  providers: [
    ApiInterceptor,
    API_INTERCEPTOR_PROVIDER
  ]
})
export class AppModule {}
```

Finer control over specific requests can also be achieved, such as:

- Set the immediate next request to use a BASIC authentication for login, and
  the subsequent ones to use a session key in another request header;
- Set the next request to not use the default error handling, and handle errors
  directly in the calling code.

To do so, just create another shared `@Injectable()`, for example, called
`ApiRequestConfiguration`, which has state for such special cases. Then inject
it on both the `HttpInterceptor` and in the client code that makes requests.
Here is an example for such class for controlling the authentication:

```typescript
import { Injectable } from '@angular/core';
import { HttpRequest } from '@angular/common/http';

/**
 * Configuration for the performed HTTP requests
 */
@Injectable()
export class ApiRequestConfiguration {
  private nextAuthHeader: string;
  private nextAuthValue: string;

  /** Set to basic authentication */
  basic(user: string, password: string): void {
    this.nextAuthHeader = 'Authorization';
    this.nextAuthValue = 'Basic ' + btoa(user + ':' + password);
  }

  /** Set to session key */
  session(sessionKey: string): void {
    this.nextAuthHeader = 'Session';
    this.nextAuthValue = sessionKey;
  }

  /** Clear any authentication headers (to be called after logout) */
  clear(): void {
    this.nextAuthHeader = null;
    this.nextAuthValue = null;
  }

  /** Apply the current authorization headers to the given request */
  apply(req: HttpRequest<any>): HttpRequest<any> {
    const headers = {};
    if (this.nextAuthHeader) {
      headers[this.nextAuthHeader] = this.nextAuthValue;
    }
    // Apply the headers to the request
    return req.clone({
      setHeaders: headers
    });
  }
}
```

Then change the `ApiInterceptor` class to call the `apply` method.
And, of course, add `ApiRequestConfiguration` to your module `providers` and
inject it on your components or services.

## Setting up a node script

Regardless If your Angular project was generated or is managed by
[Angular CLI](https://cli.angular.io/), or you have started your project with
some other seed (for example, using [webpack](https://webpack.js.org/)
directly), you can setup a script to make sure the generated API classes are
consistent with the OpenAPI descriptor.

It is not a good practice to have generated committed to the source control
system (such as git). The only exception, is for projects using a third party
API definition that never changes, in which ng-openapi-gen is expected to run
only once. To ignore the generator output folder to in GIT, assuming the
default output folder `src/app/api`, create the `src/app/.gitignore` file,
with a line being `api`.

Setting up a script will make sure that whenever your project is started or
built, the generated files are consistent with the API definition. To do so,
create the `ng-openapi-gen.json` configuration file and add the following
`scripts` to your `package.json`:

```json
{
  "scripts": {
    "ng-openapi-gen": "ng-openapi-gen",
    "start": "npm run ng-openapi-gen && npm run ng -- serve",
    "build": "npm run ng-openapi-gen && npm run ng -- build -prod"
  }
}
```

This way whenever you run `npm start` or `npm run build`, the API classes
will be generated before actually serving / building your application.

Also, if you use several configuration files, you can specify multiple times
the call to `ng-openapi-gen`, like:
```json
{
  "scripts": {
    "ng-openapi-gen": "ng-openapi-gen",
    "generate.api1": "npm run ng-openapi-gen -c api1.json",
    "generate.api2": "npm run ng-openapi-gen -c api2.json",
    "generate": "npm run generate.api1 && npm run generate.api2",
    "start": "npm run generate && npm run ng -- serve",
    "build": "npm run generate && npm run ng -- build -prod"
  }
}
```

## Supported vendor extensions

Besides the OpenAPI 3 specification, the following vendor extensions are supported:

- `x-operation-name`: Defined in [LoopBack](https://loopback.io/doc/en/lb4/Decorators_openapi.html), this extension can be used in operations to specify the actual method name. The `operationId` is required to be unique among all tags, but with this extension, a shorter method name can be used per tag (service). Example:

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

- `x-enumNames`: Generated by [NSwag](https://github.com/RicoSuter/NSwag), this extension allows schemas which are enumerations to customize the enum names. It must be an array with the same length as the actual enum values. Example:

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

You can customize the Handlebars templates by copying the desired files from the [templates](https://github.com/cyclosproject/ng-openapi-gen/tree/master/templates) folder (only the ones you need to customize) to some folder in your project, and then reference it in the configuration file.

For example, to make objects extend a base interface, copy the 
[object.handlebars](https://github.com/cyclosproject/ng-openapi-gen/tree/master/templates) file to your `src/templates` folder. 
Then, in `ng-openapi-gen.json` file, set the following: `"templates": "src/templates"`.
Finally, the customized `src/templates/object.handlebars` would look like the following (based on the 0.17.2 version, subject to change in the future):

```handlebars
{{^hasSuperClasses}}import { BaseModel } from
'app/base-model';{{/hasSuperClasses}}

export interface {{typeName}}
{{#hasSuperClasses}} extends {{#superClasses}}{{{.}}}{{^@last}},
{{/@last}}{{/superClasses}}{{/hasSuperClasses}}
{{^hasSuperClasses}} extends BaseModel{{/hasSuperClasses}}
{
{{#properties}}
{{{tsComments}}}{{{identifier}}}{{^required}}?{{/required}}: {{{type}}};
{{/properties}}
{{#additionalPropertiesType}}

[key: string]: {{{.}}};
{{/additionalPropertiesType}}
}
```

## Custom Handlebars helpers

You can integrate your own Handlebar helpers for custom templates. To do so simply provide a `handlebars.js` file in the same directory as your templates that exports a function that recieves the Handlebars instance that will be used when generating the code from your templates.

```js
module.exports = function(handlebars) {
  // Adding a custom handlebars helper: loud
  handlebars.registerHelper('loud', function (aString) {
    return aString.toUpperCase()
  });
};
```

## Developing and contributing

The generator itself is written in TypeScript. When building, the code is transpiled to JavaScript in the `dist` folder. And the `dist` folder is the one that gets published to NPM. Even to prevent publishing from the wrong path, the `package.json` file has `"private": true`, which gets replaced by `false` in the build process.

On the other hand, for developing / running tests, `jasmine-ts` is used, so the tests run directly from TypeScript. There's even a committed VisualStudio Code debug configuration for tests.

After developing the changes, to `link` the module and test it with other node projects, run the following:

```bash
npm run build
cd dist
npm link
```

At that point, the globally available ng-openapi-gen will be the one compiled to the `dist` folder.
