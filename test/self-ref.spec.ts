import {
  InterfaceDeclaration,
  TypescriptParser
} from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import options from './self-ref.config.json';
import selfRef from './self-ref.json';

const gen = new NgOpenApiGen(selfRef, options);
gen.generate();

describe('Generation tests using self-ref.json', () => {
  it('Baz model', done => {
    const baz = gen.models.get('Foo.Bar.Baz');
    const ts = gen.templates.apply('model', baz);

    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('Baz');
      expect(decl.properties.length).toBe(3);

      const ref = decl.properties.find(p => p.name === 'refProperty');
      expect(ref).withContext('refProperty property').toBeDefined();
      if (ref) {
        expect(ref.type).toBe('Baz');
      }

      const array = decl.properties.find(p => p.name === 'arrayProperty');
      expect(array).withContext('arrayProperty property').toBeDefined();
      if (array) {
        expect(array.type).toBe('Array<Baz>');
      }

      const object = decl.properties.find(p => p.name === 'objectProperty');
      expect(object).withContext('objectProperty property').toBeDefined();
      if (object) {
        expect(object.type).toBe(`{\n'nestedArray': Array<Baz>;\n'nestedRef': Baz;\n}`);
      }

      done();
    });
  });

});
