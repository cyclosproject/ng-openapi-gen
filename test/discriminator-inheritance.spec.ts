import { TypeAliasDeclaration, TypescriptParser } from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { OpenAPIObject } from '../lib/openapi-typings';
import { Options } from '../lib/options';
import options from './discriminator-inheritance.config.json';
import spec from './discriminator-inheritance.json';

const gen = new NgOpenApiGen(spec as OpenAPIObject, options as Options);
gen.generate();

describe('Generation tests using discriminator-inheritance.json', () => {
  it('Product3 model should have discriminator property', () => {
    const model = gen.models.get('Product3');
    expect(model).toBeDefined();
    const ts = gen.templates.apply('model', model);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('Product3');
      const text = ts.substring(decl.start || 0, decl.end || ts.length);

      // Product3 should have the discriminator property 'code': 'PRODUCT3'
      expect(text).toContain('\'code\': \'PRODUCT3\'');
      expect(text).toContain('\'number\'?: string');
    });
  });

  it('Product4 model should have discriminator property (second level inheritance)', () => {
    const model = gen.models.get('Product4');
    expect(model).toBeDefined();
    const ts = gen.templates.apply('model', model);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('Product4');
      const text = ts.substring(decl.start || 0, decl.end || ts.length);

      // Product4 should have the discriminator property 'code': 'PRODUCT4'
      expect(text).toContain('\'code\': \'PRODUCT4\'');
      expect(text).toContain('\'value\'?: OtherObject');
    });
  });

  it('Product1 model should have discriminator property (first level inheritance)', () => {
    const model = gen.models.get('Product1');
    expect(model).toBeDefined();
    const ts = gen.templates.apply('model', model);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('Product1');
      const text = ts.substring(decl.start || 0, decl.end || ts.length);

      // Product1 should have the discriminator property 'code': 'PRODUCT1'
      expect(text).toContain('\'code\': \'PRODUCT1\'');
      expect(text).toContain('\'name\'?: string');
    });
  });
});
