import { OpenAPIObject } from '@loopback/openapi-v3-types';
import { TypescriptParser, TypeAliasDeclaration, InterfaceDeclaration } from 'typescript-parser';
import { Globals } from '../src/globals';
import { Options } from '../src/options';
import { Templates } from '../src/templates';
import personAndPlaceSpec from './person-place.json';
import { getModel } from './test-utils';

const personAndPlace = personAndPlaceSpec as OpenAPIObject;
const options: Options = { input: '' };
const globals = new Globals(options);
const templates = new Templates('templates', '');
templates.setGlobals(globals);

describe('Generation tests using person-place.json', () => {
  it('Id model', done => {
    const id = getModel(personAndPlace, 'Id', options);
    const ts = templates.apply('model', id);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toBe('export type Id = number;');
      done();
    });
  });

  it('Entity model', done => {
    const entity = getModel(personAndPlace, 'Entity', options);
    const ts = templates.apply('model', entity);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.find(i => i.libraryName === './id')).withContext('id import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('Entity');
      expect(decl.properties.length).toBe(1);
      const id = decl.properties[0];
      expect(id.name).toBe('id');
      expect(id.type).toBe('Id');
      done();
    });
  });

  it('Person model', done => {
    const person = getModel(personAndPlace, 'Person', options);
    const ts = templates.apply('model', person);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.find(i => i.libraryName === './entity')).withContext('entity import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName === './person-place')).withContext('person-place import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('Person');
      expect(decl.properties.length).toBe(2);
      const name = decl.properties.find(p => p.name === 'name');
      expect(name).withContext('name property').toBeDefined();
      if (name) {
        expect(name.type).toBe('string');
      }
      const places = decl.properties.find(p => p.name === 'places');
      expect(places).withContext('places property').toBeDefined();
      if (places) {
        expect(places.type).toBe('Array<PersonPlace>');
      }
      done();
    });
  });

  it('Place model', done => {
    const place = getModel(personAndPlace, 'Place', options);
    const ts = templates.apply('model', place);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.find(i => i.libraryName === './entity')).withContext('entity import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('Place');
      expect(decl.properties.length).toBe(1);
      const description = decl.properties.find(p => p.name === 'description');
      expect(description).withContext('description property').toBeDefined();
      if (description) {
        expect(description.type).toBe('string');
      }
      // There's no support for additional properties in typescript-parser. Check as text.
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toContain('[key: string]: string');
      done();
    });
  });

  it('PersonPlace model', done => {
    const person = getModel(personAndPlace, 'PersonPlace', options);
    const ts = templates.apply('model', person);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.find(i => i.libraryName === './place')).withContext('place import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('PersonPlace');
      expect(decl.properties.length).toBe(2);
      const since = decl.properties.find(p => p.name === 'since');
      expect(since).withContext('since property').toBeDefined();
      if (since) {
        expect(since.type).toBe('string');
        // The parser doesn't hold comments
        expect(ts).toContain('* The date this place was assigned to the person');
      }
      const place = decl.properties.find(p => p.name === 'place');
      expect(place).withContext('places property').toBeDefined();
      if (place) {
        expect(place.type).toBe('Place');
      }
      done();
    });
  });

});
