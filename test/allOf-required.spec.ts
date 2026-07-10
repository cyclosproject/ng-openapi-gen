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
    expect(ts).toContain('type RequiredProperties = \'id\' | \'nickname\'');
    expect(ts).toContain('export type Person = Person$ & Required<Pick<Person$, RequiredProperties>>');
  });

  it('should honor required declared alongside allOf for inline properties (#395)', () => {
    const model = gen.models.get('BigDecimalInclusionAttributeFilter');
    expect(model).toBeDefined();
    const ts = gen.templates.apply('model', model);
    // Properties declared inline in an allOf member but listed as required at
    // the enclosing schema level must not be generated as optional.
    expect(ts).toContain('\'name\': string;');
    expect(ts).toContain('\'operator\': \'IN\' | \'NOT_IN\';');
    expect(ts).toContain('\'values\': Array<number>;');
    expect(ts).not.toContain('\'name\'?:');
    expect(ts).not.toContain('\'operator\'?:');
    expect(ts).not.toContain('\'values\'?:');
  });

  it('should enforce required declared alongside allOf for referenced properties, ignoring unknown names', () => {
    const model = gen.models.get('RequiredFromBase');
    expect(model).toBeDefined();
    const ts = gen.templates.apply('model', model);
    // 'id' is declared by the referenced PartialPerson, so it is enforced via
    // Required<Pick<...>>. 'ghost' matches no declared property and is ignored.
    expect(ts).toContain('type RequiredProperties = \'id\';');
    expect(ts).not.toContain('ghost');
    expect(ts).toContain('export type RequiredFromBase = RequiredFromBase$ & Required<Pick<RequiredFromBase$, RequiredProperties>>');
  });

  it('should honor required for a property declared in a member\'s own nested allOf (#395)', () => {
    const model = gen.models.get('NestedInlineRequired');
    expect(model).toBeDefined();
    const ts = gen.templates.apply('model', model);
    // Both the directly-declared and the nested-allOf-declared property must be
    // required.
    expect(ts).toContain('\'shallow\': string;');
    expect(ts).toContain('\'deep\': string;');
    expect(ts).not.toContain('\'shallow\'?:');
    expect(ts).not.toContain('\'deep\'?:');
  });

  it('should not emit Required<Pick<>> when the type is nullable (would not compile)', () => {
    const model = gen.models.get('RequiredFromNullableBase');
    expect(model).toBeDefined();
    const ts = gen.templates.apply('model', model);
    // X$ renders as `NullablePerson | null`, whose keyof is never, so a Pick
    // would fail to compile; the required is safely left unenforced instead.
    expect(ts).not.toContain('Required<Pick');
    expect(ts).toContain('export type RequiredFromNullableBase = NullablePerson | null;');
  });

  it('should not emit Required<Pick<>> when the enclosing schema is a union (would not compile)', () => {
    const model = gen.models.get('EnclosingUnionWithRequired');
    expect(model).toBeDefined();
    const ts = gen.templates.apply('model', model);
    // oneOf makes X$ a union whose keyof is never; no Pick must be generated.
    expect(ts).not.toContain('Required<Pick');
  });

  it('should not emit Required<Pick<>> for a referenced member that is a union (would not compile)', () => {
    const model = gen.models.get('RequiredFromUnionRef');
    expect(model).toBeDefined();
    const ts = gen.templates.apply('model', model);
    // RefWithUnionAndProps renders as a union, so 'foo' is not a usable key and
    // must not be picked.
    expect(ts).not.toContain('Required<Pick');
  });

  it('should enforce a required property declared in a referenced base\'s own allOf', () => {
    const model = gen.models.get('RequiredFromDeepRef');
    expect(model).toBeDefined();
    const ts = gen.templates.apply('model', model);
    // 'gid' is declared by GrandBase, reached by recursing into MidBase's allOf.
    expect(ts).toContain('type RequiredProperties = \'gid\';');
    expect(ts).toContain('Required<Pick<RequiredFromDeepRef$, RequiredProperties>>');
  });

  it('should handle a name declared both inline and in a referenced member without duplicating enforcement', () => {
    const model = gen.models.get('InlineAndReferenced');
    expect(model).toBeDefined();
    const ts = gen.templates.apply('model', model);
    expect(ts).toContain('\'shared\': string;');
    expect(ts).not.toContain('\'shared\'?:');
    expect(ts).not.toContain('Required<Pick');
  });
});
