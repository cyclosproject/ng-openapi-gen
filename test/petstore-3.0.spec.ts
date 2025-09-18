import { InterfaceDeclaration, TypeAliasDeclaration, TypescriptParser, ClassDeclaration } from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import options from './petstore-3.0.config.json';
import petstore from './petstore-3.0.json';

const gen = new NgOpenApiGen(petstore as any, options);
gen.generate();

describe('Generation tests using petstore-3.0.json', () => {

  it('Tags', () => {
    expect(gen.services.size).toBe(1);
  });

  it('pets tag', () => {
    const pets = gen.services.get('pets');
    expect(pets).toBeDefined();
    if (!pets) return;
    expect(pets.operations.length).toBe(3);
    const ts = gen.templates.apply('service', pets);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(ClassDeclaration));
      const cls = ast.declarations[0] as ClassDeclaration;

      const listPets = cls.methods.find(m => m.name === 'listPets');
      expect(listPets).toBeDefined();
      if (listPets) {
        expect(listPets.parameters.length).toBe(2);
        const type = listPets.parameters[0].type;
        expect(type).toEqual('ListPets$Params');
      }

      const createPets = cls.methods.find(m => m.name === 'createPets');
      expect(createPets).toBeDefined();
      if (createPets) {
        expect(createPets.parameters.length).toBe(2);
        const type = createPets.parameters[0].type;
        expect(type).toEqual('CreatePets$Params');
      }

      const showPetById = cls.methods.find(m => m.name === 'showPetById');
      expect(showPetById).toBeDefined();
      if (showPetById) {
        expect(showPetById.parameters.length).toBe(2);
        const type = showPetById.parameters[0].type;
        expect(type).toEqual('ShowPetById$Params');
      }


    });
  });

  it('Pet model', () => {
    const pet = gen.models.get('Pet');
    const ts = gen.templates.apply('model', pet);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
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

    });
  });

  it('Pets model', () => {
    const pets = gen.models.get('Pets');
    const ts = gen.templates.apply('model', pets);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.find(i => i.libraryName.endsWith('/petstore-pet-model'))).toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toBe('export type PetstorePetsModel = Array<PetstorePetModel>;');

    });
  });

  it('Error model', () => {
    const entity = gen.models.get('Error');
    const ts = gen.templates.apply('model', entity);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
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

    });
  });

});
