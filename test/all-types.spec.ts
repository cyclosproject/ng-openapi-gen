import { OpenAPIObject } from '@loopback/openapi-v3-types';
import { InterfaceDeclaration, TypeAliasDeclaration, TypescriptParser, EnumDeclaration } from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import options from './all-types.config.json';
import allTypesSpec from './all-types.json';
import { Options } from '../lib/options';

const gen = new NgOpenApiGen(allTypesSpec as OpenAPIObject, options as Options);
gen.generate();

describe('Generation tests using all-types.json', () => {
  it('RefEnum model', done => {
    const refString = gen.models.get('RefEnum');
    const ts = gen.templates.apply('model', refString);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(EnumDeclaration));
      const decl = ast.declarations[0] as EnumDeclaration;
      expect(decl.name).toBe('RefEnum');
      expect(decl.members.length).toBe(3);
      expect(decl.members[0]).toBe('ValueA');
      expect(decl.members[1]).toBe('ValueB');
      expect(decl.members[2]).toBe('ValueC');
      done();
    });
  });

  it('RefObject model', done => {
    const refObject = gen.models.get('RefObject');
    const ts = gen.templates.apply('model', refObject);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('RefObject');
      expect(decl.properties.length).toBe(1);
      expect(decl.properties[0].type).toBe('string');
      done();
    });
  });

  it('OtherObject model', done => {
    const otherObject = gen.models.get('OtherObject');
    const ts = gen.templates.apply('model', otherObject);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(1);
      expect(ast.imports.find(i => i.libraryName === './ref-object')).withContext('ref-object import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('OtherObject');
      expect(decl.properties.length).toBe(0);
      // There's no support for additional properties in typescript-parser. Check as text.
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toContain('[key: string]: any');
      done();
    });
  });

  it('Union model', done => {
    const union = gen.models.get('Union');
    const ts = gen.templates.apply('model', union);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.find(i => i.libraryName === './ref-enum')).withContext('ref-enum import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName === './container')).withContext('container import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('Union');
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toBe('export type Union = { [key: string]: any } | RefEnum | Container;');
      done();
    });
  });

  it('Container model', done => {
    const container = gen.models.get('Container');
    const ts = gen.templates.apply('model', container);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(4);
      expect(ast.imports.find(i => i.libraryName === './ref-enum')).withContext('ref-enum import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName === './ref-object')).withContext('ref-object import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName === './other-object')).withContext('other-object import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName === './union')).withContext('union import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('Container');
      expect(decl.properties.length).toBe(17);

      // Assert the simple types
      function assertProperty(name: string, type: string) {
        const prop = decl.properties.find(p => p.name === name);
        expect(prop).withContext(`${name} property`).toBeDefined();
        if (prop) {
          expect(prop.type).toEqual(type);
        }
      }
      assertProperty('stringProp', 'string');
      assertProperty('integerProp', 'number');
      assertProperty('numberProp', 'number');
      assertProperty('booleanProp', 'boolean');
      assertProperty('anyProp', 'any');

      assertProperty('refEnumProp', 'RefEnum');
      assertProperty('refObjectProp', 'RefObject');
      assertProperty('unionProp', 'Union');
      assertProperty('containerProp', 'Container');
      assertProperty('arrayOfStringsProp', 'Array<string>');
      assertProperty('arrayOfIntegersProp', 'Array<number>');
      assertProperty('arrayOfNumbersProp', 'Array<number>');
      assertProperty('arrayOfBooleansProp', 'Array<boolean>');
      assertProperty('arrayOfRefEnumsProp', 'Array<RefEnum>');
      assertProperty('arrayOfRefObjectsProp', 'Array<RefObject>');
      assertProperty('arrayOfAnyProp', 'Array<any>');
      assertProperty('nestedObject', '{ \'p1\': string, \'p2\': number, ' +
        '\'deeper\': { \'d1\': RefObject, \'d2\': string | Array<RefObject> | number } }');

      // There's no support for additional properties in typescript-parser. Check as text.
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toContain('[key: string]: OtherObject');

      done();
    });
  });
});
