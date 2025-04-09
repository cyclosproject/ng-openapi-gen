import { OpenAPIObject } from 'openapi3-ts';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import options from './functionIndex.config.json';
import templatesSpec from './functionIndex.json';
import { NamedExport, TypescriptParser } from 'typescript-parser';

describe('Generation tests with index and no ApiModule', () => {
  const gen = new NgOpenApiGen(templatesSpec as OpenAPIObject, options);

  beforeAll(() => {
    gen.generate();
  });

  it('functionIndex file', done => {
    const operations = [...gen.operations.values()];
    const functions = operations.reduce((opAcc, operation) => [
      ...opAcc,
      ...operation.variants
    ], []);

    const ts = gen.templates.apply('functionIndex', {functions});
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.exports.length).withContext('Has the correct number of exports').toBe(1);
      expect(ast.exports.some((ex: NamedExport) => ex.from === './fn/operations/get-foos')).withContext('Exports correct file').toBeTrue();
      expect(ast.usages).withContext('Exports correct types').toContain('GetFoos$Params');
      expect(ast.usages).withContext('Exports correct types').toContain('getFoos');
      done();
    });
  });

});
