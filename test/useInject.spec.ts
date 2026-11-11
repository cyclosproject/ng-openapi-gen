import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import options from './useInject.config.json';
import petstoreSpec from './petstore-3.0.json';
import * as fs from 'fs';
import { Options } from '../lib/options';
import { OpenAPIObject } from '../lib/openapi-typings';

const spec = petstoreSpec as unknown as OpenAPIObject;

describe('Test useInject generation', () => {

  it('useInject', () => {
    const gen = new NgOpenApiGen(spec, {
      ...options,
      output: 'out/useInject/'
    } as Options);
    gen.generate();
    const read = (file: string) => fs.readFileSync(fs.realpathSync(`${gen.outDir}/${file}`), 'utf8');

    const baseService = read('base-service.ts');
    expect(baseService).toContain('import { Injectable, inject } from \'@angular/core\';');
    expect(baseService).toContain('protected config = inject(ApiConfiguration);');
    expect(baseService).toContain('protected http = inject(HttpClient);');
    expect(baseService).not.toContain('constructor(');

    const api = read('api.ts');
    expect(api).toContain('private config = inject(ApiConfiguration);');
    expect(api).toContain('private http = inject(HttpClient);');
    expect(api).not.toContain('constructor(');

    const service = read('services/pets.service.ts');
    expect(service).toContain('import { HttpContext } from \'@angular/common/http\';');
    expect(service).not.toContain('ApiConfiguration');
    expect(service).not.toContain('constructor(');
  });

});
