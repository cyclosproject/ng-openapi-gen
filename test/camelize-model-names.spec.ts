import { InterfaceDeclaration, TypescriptParser } from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { Options } from '../lib/options';
import options from './camelize-model-names.config.json';
import camelizeModelNamesSpec from './camelize-model-names.json';
import { OpenAPIObject } from '../lib/openapi-typings';

const spec = camelizeModelNamesSpec as unknown as OpenAPIObject;
const gen = new NgOpenApiGen(spec, options as Options);
gen.generate();

describe('Generation tests using camelize-model-names.json', () => {
  it('snake-case model', done => {
    const ref = gen.models.get('snake-case');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('PreSnake_casePos');
      done();
    });
  });
  it('camelCase model', done => {
    const ref = gen.models.get('camelCase');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('PreCamelCasePos');
      done();
    });
  });
});
