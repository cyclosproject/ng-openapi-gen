import { NamedExport, TypescriptParser } from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { OpenAPIObject } from '../lib/openapi-typings';
import options from './functionIndex.config.json';
import templatesSpec from './functionIndex.json';

const spec = templatesSpec as unknown as OpenAPIObject;

describe('Generation tests with index and no ApiModule', () => {
  const gen = new NgOpenApiGen(spec, options);

  beforeAll(() => {
    gen.generate();
  });

  it('functionIndex file', async () => {
    const operations = [...gen.operations.values()];
    const functions = operations.reduce((opAcc, operation) => [
      ...opAcc,
      ...operation.variants
    ], []);

    const ts = gen.templates.apply('functionIndex', {functions});
    const parser = new TypescriptParser();
    const ast = await parser.parseSource(ts);

    expect(ast.exports.length).toBe(2); // 1 type + 1 function
    expect(ast.exports.some((ex: NamedExport) => ex.from === './fn/operations/get-foos')).toBe(true);
    expect(ast.usages).toContain('GetFoos$Params');
    expect(ast.usages).toContain('getFoos');
  });

});
