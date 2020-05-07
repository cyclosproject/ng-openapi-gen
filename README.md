ng-openapi-gen: An OpenAPI 3 code generator for Angular
---

![Build status](https://github.com/cyclosproject/ng-openapi-gen/workflows/build/badge.svg)
![Test status](https://github.com/cyclosproject/ng-openapi-gen/workflows/test/badge.svg)

This project is a NPM module that generates model interfaces and web service clients from an [OpenApi 3](https://www.openapis.org/) [specification](https://github.com/OAI/OpenAPI-Specification).
The generated classes follow the principles of [Angular](https://angular.io/).
The generated code is compatible with Angular 7+.

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
- Generated files should compile using strict `TypeScript` compiler flags, such as `noUnusedLocals` and `noUnusedParameters`.

## Limitations

- Only standard OpenAPI 3 descriptions will be generated. `ng-swagger-gen` allows several extensions, specially types from JSON schema, but they are out of scope for `ng-openapi-gen`. There is, however, support for a few [vendor extensions](#Supported_vendor_extensions);
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

This will expect the file `my-api.yaml` to be in the current directory, and will generate the files on `my-app/src/app/api`.

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
    HttpClientModule
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
consistent with the swagger descriptor.

To do so, create the `ng-openapi-gen.json` configuration file and add the
following `scripts` to your `package.json`:
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
