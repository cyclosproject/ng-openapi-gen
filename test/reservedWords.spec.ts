import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { OpenAPIObject } from '../lib/openapi-typings';
import options from './reservedWords.config.json';
import templatesSpec from './reservedWords.json';
import { TypescriptParser } from 'typescript-parser';

const spec = templatesSpec as unknown as OpenAPIObject;

describe('Generation tests with reserved words', () => {
  const gen = new NgOpenApiGen(spec, options);

  beforeAll(() => {
    gen.generate();
  });

  it('index file', () => {
    const general = { models: gen.models, functions: gen.functions };
    const ts = gen.templates.apply('index', general);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.exports.length).toBe(6);
      expect(ast.exports[4]).toMatchObject({
        from: './fn/operations/import',
        specifiers: [{ specifier: 'Import$Params' }]
      });
      expect(ast.exports[5]).toMatchObject({
        from: './fn/operations/import',
        specifiers: [{ specifier: 'import$' }]
      });
    });
  });

});
