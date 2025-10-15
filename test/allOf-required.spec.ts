import { TypeAliasDeclaration, TypescriptParser } from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { Options } from '../lib/options';
import allOfRequired from './allOf-required.json';
import { OpenAPIObject } from '../lib/openapi-typings';
import options from './allOf-required.config.json';

const spec = allOfRequired as unknown as OpenAPIObject;
const gen = new NgOpenApiGen(spec, options as Options);
gen.generate();

describe('Generation tests using allOf-required.json', () => {
  it('Person model should have correct type alias structure', () => {
    const model = gen.models.get('Person');
    expect(model).toBeDefined();
    const ts = gen.templates.apply('model', model);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      // Should have 3 declarations: Person$ internal type, RequiredProperties type, and Person export
      expect(ast.declarations.length).toBe(3);

      // Check Person$ internal type (should be the first declaration)
      const personInternalDecl = ast.declarations[0] as TypeAliasDeclaration;
      expect(personInternalDecl.name).toBe('Person$');
      expect(personInternalDecl.isExported).toBe(false);

      // Check RequiredProperties declaration (should be the second declaration)
      const requiredPropsDecl = ast.declarations[1] as TypeAliasDeclaration;
      expect(requiredPropsDecl.name).toBe('RequiredProperties');
      expect(requiredPropsDecl.isExported).toBe(false);

      // Check Person export (should be the last declaration)
      const personExport = ast.declarations[2];
      expect(personExport).toEqual(expect.any(TypeAliasDeclaration));
      const personDecl = personExport as TypeAliasDeclaration;
      expect(personDecl.name).toBe('Person');
      expect(personDecl.isExported).toBe(true);
    });
  });

  it('Person model should contain intersection type with required properties', () => {
    const model = gen.models.get('Person');
    expect(model).toBeDefined();
    const ts = gen.templates.apply('model', model);
    // Check the generated TypeScript content structure
    expect(ts).toContain('type Person$ = PartialPerson & {');
    expect(ts).toContain('type RequiredProperties = "id" | "nickname"');
    expect(ts).toContain('export type Person = Person$ & Required<Pick<Person$, RequiredProperties>>');
  });
});
