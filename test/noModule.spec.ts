import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { OpenAPIObject } from '../lib/openapi-typings';
import options from './noModule.config.json';
import templatesSpec from './noModule.json';
import { NamedExport, TypescriptParser } from 'typescript-parser';

const spec = templatesSpec as unknown as OpenAPIObject;

describe('Generation tests with index and no ApiModule', () => {
  const gen = new NgOpenApiGen(spec, options);

  beforeAll(() => {
    gen.generate();
  });

  it('index file', done => {
    const ref = gen.models.get('InlineObject');
    const ts = gen.templates.apply('index', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.exports.length).withContext('Has the correct number of exports').toBe(4);
      expect(ast.exports.some((ex: NamedExport) => ex.from === './api-configuration')).withContext('Has an ApiConfiguration export').toBeDefined();
      expect(ast.exports.some((ex: NamedExport) => ex.from === './base-service')).withContext('Has a BaseService export').toBeDefined();
      expect(ast.exports.some((ex: NamedExport) => ex.from === './request-builder')).withContext('Has a RequestBuilder export').toBeDefined();
      expect(ast.exports.some((ex: NamedExport) => ex.from === './strict-http-response')).withContext('Has a StrictHttpResponse export').toBeDefined();
      done();
    });
  });

});
