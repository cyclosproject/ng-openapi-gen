import { InterfaceDeclaration, TypeAliasDeclaration, TypescriptParser } from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import options from './person-place.config.json';
import personAndPlaceSpec from './person-place.json';

const gen = new NgOpenApiGen(personAndPlaceSpec as any, options);
gen.generate();

describe('Generation tests using person-place.json', () => {
  it('Id model', () => {
    const id = gen.models.get('Id');
    const ts = gen.templates.apply('model', id);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toBe('export type PPIdModel = string;');

    });
  });

  it('Entity model', () => {
    const entity = gen.models.get('Entity');
    const ts = gen.templates.apply('model', entity);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.find(i => i.libraryName.endsWith('/pp-id-model'))).toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('PPEntityModel');
      expect(decl.properties.length).toBe(1);
      const id = decl.properties[0];
      expect(id.name).toBe('id');
      expect(id.type).toBe('PPIdModel');

    });
  });

  it('Person model', () => {
    const person = gen.models.get('Person');
    const ts = gen.templates.apply('model', person);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.find(i => i.libraryName.endsWith('/pp-entity-model'))).toBeDefined();
      expect(ast.imports.find(i => i.libraryName.endsWith('/pp-person-place-model'))).toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('PPPersonModel');
      // There's no support for additional properties in typescript-parser. Check as text.
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toContain('PPEntityModel & {\n\'name\'?: string;\n\'places\'?: Array<PPPersonPlaceModel>;\n}');

    });
  });

  it('Place model', () => {
    const place = gen.models.get('Place');
    const ts = gen.templates.apply('model', place);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.find(i => i.libraryName.endsWith('/pp-entity-model'))).toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('PPPlaceModel');
      // There's no support for additional properties in typescript-parser. Check as text.
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toContain('PPEntityModel & (PPGpsLocationModel | {\n\n/**\n * Street address\n */\n\'address\'?: string;\n}) & {\n\'description\'\?: string;\n[key: string]: string;\n}');

    });
  });

  it('PersonPlace model', () => {
    const person = gen.models.get('PersonPlace');
    const ts = gen.templates.apply('model', person);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.find(i => i.libraryName.endsWith('/pp-place-model'))).toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('PPPersonPlaceModel');
      expect(decl.properties.length).toBe(2);
      const since = decl.properties.find(p => p.name === 'since');
      expect(since).toBeDefined();
      if (since) {
        expect(since.type).toBe('string');
        // The parser doesn't hold comments
        expect(ts).toContain('* The date this place was assigned to the person');
      }
      const place = decl.properties.find(p => p.name === 'place');
      expect(place).toBeDefined();
      if (place) {
        expect(place.type).toBe('PPPlaceModel');
      }

    });
  });

});
