import {
  InterfaceDeclaration,
  TypeAliasDeclaration,
  TypescriptParser
} from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import options from './employees.config.json';
import employeesSpec from './employees.json';

const gen = new NgOpenApiGen(employeesSpec, options);
gen.generate();

describe('Generation tests using employees.json', () => {
  it('Id model', done => {
    const id = gen.models.get('Id');
    const ts = gen.templates.apply('model', id);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toBe('export type EMPIdModel = string;');
      done();
    });
  });

  it('Entity model', done => {
    const entity = gen.models.get('Entity');
    const ts = gen.templates.apply('model', entity);
    console.log('>>>>> ', ts);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.find(i => i.libraryName === './emp-id-model'))
        .withContext('id import')
        .toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('EMPEntityModel');
      expect(decl.properties.length).toBe(1);
      const id = decl.properties[0];
      expect(id.name).toBe('id');
      expect(id.type).toBe('EMPIdModel');
      done();
    });
  });

  it('Employee model', done => {
    const employee = gen.models.get('Namespace.Employee');
    const ts = gen.templates.apply('model', employee);

    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.find(i => i.libraryName === '../emp-entity-model'))
        .withContext('entity import')
        .toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('EMPEmployeeModel');
      expect(decl.properties.length).toBe(2);
      const name = decl.properties.find(p => p.name === 'name');
      expect(name)
        .withContext('name property')
        .toBeDefined();
      if (name) {
        expect(name.type).toBe('string');
      }
      const boss = decl.properties.find(p => p.name === 'boss');
      expect(boss)
        .withContext('boss property')
        .toBeDefined();
      if (boss) {
        expect(boss.type).toBe('EMPEmployeeModel');
      }
      done();
    });
  });

});
