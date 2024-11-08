import {
  InterfaceDeclaration,
  TypeAliasDeclaration,
  TypescriptParser,
  ClassDeclaration,
} from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import options from './petstore-experimental.config.json';
import petstore from './petstore-experimental.json';

const gen = new NgOpenApiGen(petstore, options);
gen.generate();

describe('Generation tests using petstore-experimental.json', () => {
  it('Tags', () => {
    expect(gen.services.size).toBe(1);
  });

  it('pets tag', done => {
    const pets = gen.services.get('pets');
    expect(pets).toBeDefined();
    if (!pets) return;
    expect(pets.operations.length).toBe(3);
    const ts = gen.templates.apply('service', pets);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(ClassDeclaration));
      const cls = ast.declarations[0] as ClassDeclaration;

      const listPets = cls.methods.find(m => m.name === 'listPets');
      expect(listPets).withContext('listPets').toBeDefined();
      if (listPets) {
        expect(listPets.parameters.length).toBe(2);
        const type = listPets.parameters[0].type;
        expect(type).toEqual('ListPets$Params');
      }

      const createPets = cls.methods.find(m => m.name === 'createPets');
      expect(createPets).withContext('createPets').toBeDefined();
      if (createPets) {
        expect(createPets.parameters.length).toBe(2);
        const type = createPets.parameters[0].type;
        expect(type).toEqual('CreatePets$Params');
      }

      const showPetById = cls.methods.find(m => m.name === 'showPetById');
      expect(showPetById).withContext('showPetById').toBeDefined();
      if (showPetById) {
        expect(showPetById.parameters.length).toBe(2);
        const type = showPetById.parameters[0].type;
        expect(type).toEqual('ShowPetById$Params');
      }

      done();
    });
  });

  it('listPets-fn properties', done => {
    const pets = gen.services.get('pets');
    const petsList = pets?.operations?.find(op => op.id === 'listPets');
    expect(petsList).toBeDefined();
    if (!petsList) return;
    const ts = gen.templates.apply('fn', petsList.variants[0]);
    const parser = new TypescriptParser();

    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(2);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl?.name).toEqual('ListPets$Params');

      const limit = decl.properties[0];
      expect(limit.isOptional).toBe(true);
      expect(limit.name).toBe('limit');
      expect(limit.type).toBe('number');

      done();
    });
  });

  it('createPets-fn properties', done => {
    const pets = gen.services.get('pets');
    const petsList = pets?.operations?.find(op => op.id === 'createPets');
    expect(petsList).toBeDefined();
    if (!petsList) return;
    const ts = gen.templates.apply('fn', petsList.variants[0]);
    const parser = new TypescriptParser();

    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(2);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl?.name).toEqual('CreatePets$Params');

      const body = decl.properties[0];
      expect(body.isOptional).toBe(false);
      expect(body.name).toBe('body');
      expect(body.type).toBe('Utils.Writable<PetstorePetModel>');

      done();
    });
  });

  it('showPetById-fn properties', done => {
    const pets = gen.services.get('pets');
    const petsList = pets?.operations?.find(op => op.id === 'showPetById');
    expect(petsList).toBeDefined();
    if (!petsList) return;
    const ts = gen.templates.apply('fn', petsList.variants[0]);
    const parser = new TypescriptParser();

    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(2);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl?.name).toEqual('ShowPetById$Params');

      const petId = decl.properties[0];
      expect(petId.isOptional).toBe(false);
      expect(petId.name).toBe('petId');
      expect(petId.type).toBe('string');

      done();
    });
  });

  it('Pet model', (done) => {
    const pet = gen.models.get('Pet');
    const ts = gen.templates.apply('model', pet);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then((ast) => {
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('PetstorePetModel');
      expect(decl.properties.length).toBe(3);
      const id = decl.properties[0];
      expect(id.isOptional).toBe(false);
      expect(id.name).toBe('id');
      expect(id.type).toBe('number');
      const name = decl.properties[1];
      expect(name.isOptional).toBe(false);
      expect(name.name).toBe('name');
      expect(name.type).toBe('string');
      const tag = decl.properties[2];
      expect(tag.isOptional).toBe(true);
      expect(tag.name).toBe('tag');
      expect(tag.type).toBe('string');
      done();
    });
  });

  it('Pets model', done => {
    const pets = gen.models.get('Pets');
    const ts = gen.templates.apply('model', pets);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.find(i => i.libraryName.endsWith('/petstore-pet-model'))).withContext('pet import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toBe('export type PetstorePetsModel = Array<PetstorePetModel>;');
      done();
    });
  });

  it('Error model', (done) => {
    const entity = gen.models.get('Error');
    const ts = gen.templates.apply('model', entity);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then((ast) => {
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('PetstoreErrorModel');
      expect(decl.properties.length).toBe(2);
      const code = decl.properties[0];
      expect(code.isOptional).toBe(false);
      expect(code.name).toBe('code');
      expect(code.type).toBe('number');
      const message = decl.properties[1];
      expect(message.isOptional).toBe(false);
      expect(message.name).toBe('message');
      expect(message.type).toBe('string');
      done();
    });
  });
});
