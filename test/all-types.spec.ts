import { OpenAPIObject } from '@loopback/openapi-v3-types';
import { EnumDeclaration, InterfaceDeclaration, TypeAliasDeclaration, TypescriptParser } from 'typescript-parser';
import { Globals } from '../src/globals';
import { Options } from '../src/options';
import { Templates } from '../src/templates';
import allTypesSpec from './all-types.json';
import { getModel } from './test-utils';

const allTypes = allTypesSpec as OpenAPIObject;
const options: Options = { input: '' };
const globals = new Globals(options);
const templates = new Templates('templates', '');
templates.setGlobals(globals);

describe('Generation tests using all-types.json', () => {
  it('RefEnum model', done => {
    const refString = getModel(allTypes, 'RefEnum', options);
    const ts = templates.apply('model', refString);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(EnumDeclaration));
      const decl = ast.declarations[0] as EnumDeclaration;
      expect(decl.name).toBe('RefEnum');
      expect(decl.members).toEqual(['VALUE_A', 'VALUE_B', 'VALUE_C']);
      done();
    });
  });

  it('RefObject model', done => {
    const refObject = getModel(allTypes, 'RefObject', options);
    const ts = templates.apply('model', refObject);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('RefObject');
      expect(decl.properties.length).toBe(0);
      // There's no support for additional properties in typescript-parser. Check as text.
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toContain('[key: string]: any');
      done();
    });
  });

  it('Union model', done => {
    const union = getModel(allTypes, 'Union', options);
    const ts = templates.apply('model', union);
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
    const container = getModel(allTypes, 'Container', options);
    const ts = templates.apply('model', container);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(2);
      expect(ast.imports.find(i => i.libraryName === './ref-enum')).withContext('ref-enum import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName === './ref-object')).withContext('ref-object import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('Container');
      expect(decl.properties.length).toBe(16);

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
      assertProperty('containerProp', 'Container');
      assertProperty('arrayOfStringsProp', 'Array<string>');
      assertProperty('arrayOfIntegersProp', 'Array<number>');
      assertProperty('arrayOfNumbersProp', 'Array<number>');
      assertProperty('arrayOfBooleansProp', 'Array<boolean>');
      assertProperty('arrayOfRefEnumsProp', 'Array<RefEnum>');
      assertProperty('arrayOfRefObjectsProp', 'Array<RefObject>');
      assertProperty('arrayOfAnyProp', 'Array<any>');
      assertProperty('nestedObject', "{ 'p1': string, 'p2': number, " +
        "'deeper': { 'd1': RefObject, 'd2': string | Array<RefObject> | number } }");

      done();
    });
  });
});
