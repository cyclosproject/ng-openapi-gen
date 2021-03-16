import { OpenAPIObject } from '@loopback/openapi-v3-types';
import { ClassDeclaration, EnumDeclaration, InterfaceDeclaration, TypeAliasDeclaration, TypescriptParser } from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { Options } from '../lib/options';
import options from './all-types.config.json';
import allTypesSpec from './all-types.json';

const gen = new NgOpenApiGen(allTypesSpec as OpenAPIObject, options as Options);
gen.generate();

it('Api', done => {
  const api = gen.services.get('Api');
  expect(api).toBeDefined();
  if (api) {
    const ts = gen.templates.apply('service', api);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(ClassDeclaration));
      const cls = ast.declarations[0] as ClassDeclaration;
      expect(cls.methods.length).toEqual(3 * 2); // foo, bar, baz, in 2 variants each
      // Should have imported referenced-in-service-one-of-1/2
      expect(ast.imports.find(i => i.libraryName === '../models/referenced-in-service-one-of-1')).withContext('ref1 import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName === '../models/referenced-in-service-one-of-2')).withContext('ref2 import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName === '../models/a/b/ref-object')).withContext('a.b.RefObject import').toBeDefined();
      // But not referenced-in-one-of, as it is nested within an object schema
      expect(ast.imports.find(i => i.libraryName === '../models/referenced-in-one-of')).withContext('ref import').toBeUndefined();
      done();
    });
  }
});

describe('Generation tests using all-types.json', () => {
  it('RefEnum model', done => {
    const ref = gen.models.get('RefEnum');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(EnumDeclaration));
      const decl = ast.declarations[0] as EnumDeclaration;
      expect(decl.name).toBe('RefEnum');
      expect(decl.members.length).toBe(4);
      expect(decl.members[0]).toBe('ValueA');
      expect(decl.members[1]).toBe('ValueB');
      expect(decl.members[2]).toBe('ValueC');
      expect(decl.members[3]).toBe('_');
      done();
    });
  });

  it('RefIntEnum model', done => {
    const ref = gen.models.get('RefIntEnum');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(EnumDeclaration));
      const decl = ast.declarations[0] as EnumDeclaration;
      expect(decl.name).toBe('RefIntEnum');
      expect(decl.members.length).toBe(3);
      expect(decl.members[0]).toBe('$100');
      expect(decl.members[1]).toBe('$200');
      expect(decl.members[2]).toBe('$300');
      done();
    });
  });

  it('RefNamedIntEnum model', done => {
    const ref = gen.models.get('RefNamedIntEnum');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(EnumDeclaration));
      const decl = ast.declarations[0] as EnumDeclaration;
      expect(decl.name).toBe('RefNamedIntEnum');
      expect(decl.members.length).toBe(3);
      expect(decl.members[0]).toBe('first');
      expect(decl.members[1]).toBe('second');
      expect(decl.members[2]).toBe('third');
      done();
    });
  });

  it('NullableObject model', done => {
    const refObject = gen.models.get('NullableObject');
    const ts = gen.templates.apply('model', refObject);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('NullableObject');
      expect(decl.properties.length).toBe(1);
      expect(decl.properties[0].type).toBe('string');
      done();
    });
  });

  it('a.b.RefObject model', done => {
    const refObject = gen.models.get('a.b.RefObject');
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

  it('x.y.RefObject model', done => {
    const otherObject = gen.models.get('x.y.RefObject');
    const ts = gen.templates.apply('model', otherObject);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(1);
      expect(ast.imports.find(i => i.libraryName === '../../a/b/ref-object')).withContext('a/b/ref-object import').toBeDefined();
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

  it('union model', done => {
    const union = gen.models.get('union');
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
      expect(text).toBe('export type Union = ({ [key: string]: any } | RefEnum | RefIntEnum | RefNamedIntEnum | Container);');
      done();
    });
  });

  it('disjunct model', done => {
    const disjunct = gen.models.get('disjunct');
    const ts = gen.templates.apply('model', disjunct);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(5);
      expect(ast.imports.find(i => i.libraryName === './referenced-in-nullable-one-of')).withContext('referenced-in-nullable-one-of import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('Disjunct');
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toBe('export type Disjunct = ({ \'ref\'?: ReferencedInNullableOneOf | null } | ABRefObject | XYRefObject | ReferencedInOneOf | EscapedProperties);');
      done();
    });
  });

  it('ReferencedInOneOf model', done => {
    const ref = gen.models.get('ReferencedInOneOf');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('ReferencedInOneOf');
      expect(decl.properties.length).toBe(1);
      expect(decl.properties[0].name).toBe('name');
      expect(decl.properties[0].type).toBe('string');
      done();
    });
  });

  it('ReferencedInNullableOneOf model', done => {
    const ref = gen.models.get('ReferencedInNullableOneOf');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('ReferencedInNullableOneOf');
      expect(decl.properties.length).toBe(1);
      expect(decl.properties[0].name).toBe('name');
      expect(decl.properties[0].type).toBe('string');
      done();
    });
  });

  it('ReferencedInServiceOneOf1 model', done => {
    const ref = gen.models.get('ReferencedInServiceOneOf1');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('ReferencedInServiceOneOf1');
      expect(decl.properties.length).toBe(1);
      expect(decl.properties[0].name).toBe('name');
      expect(decl.properties[0].type).toBe('string');
      done();
    });
  });

  it('ReferencedInServiceOneOf2 model', done => {
    const ref = gen.models.get('ReferencedInServiceOneOf2');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('ReferencedInServiceOneOf2');
      expect(decl.properties.length).toBe(1);
      expect(decl.properties[0].name).toBe('name');
      expect(decl.properties[0].type).toBe('string');
      done();
    });
  });

  it('ReferencedInParamOneOf1 model', done => {
    const ref = gen.models.get('ReferencedInParamOneOf1');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('ReferencedInParamOneOf1');
      expect(decl.properties.length).toBe(1);
      expect(decl.properties[0].name).toBe('name');
      expect(decl.properties[0].type).toBe('string');
      done();
    });
  });

  it('ReferencedInParamOneOf2 model', done => {
    const ref = gen.models.get('ReferencedInParamOneOf2');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('ReferencedInParamOneOf2');
      expect(decl.properties.length).toBe(1);
      expect(decl.properties[0].name).toBe('name');
      expect(decl.properties[0].type).toBe('string');
      done();
    });
  });

  it('AdditionalProperties model', done => {
    const ref = gen.models.get('AdditionalProperties');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(1);
      expect(ast.imports.find(i => i.libraryName === './a/b/ref-object')).withContext('a/b/ref-object import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('AdditionalProperties');
      expect(decl.properties.length).toBe(3);
      expect(decl.properties[0].name).toBe('age');
      expect(decl.properties[0].type).toBe('null | number');
      expect(decl.properties[1].name).toBe('description');
      expect(decl.properties[1].type).toBe('string');
      expect(decl.properties[2].name).toBe('name');
      expect(decl.properties[2].type).toBe('string');
      expect(decl.properties[2].isOptional).toBeFalse();
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toContain('[key: string]: ABRefObject | null | number | string | undefined;');
      done();
    });
  });

  it('Nullables model', done => {
    const ref = gen.models.get('Nullables');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(1);
      expect(ast.imports.find(i => i.libraryName === './nullable-object')).withContext('nullable-object import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('Nullables');
      expect(decl.properties.length).toBe(3);
      expect(decl.properties[0].name).toBe('inlinedNullableObject');
      expect(decl.properties[0].type).withContext('inlinedNullableObject property').toBe('null | { \'someProperty\': string }');
      expect(decl.properties[0].isOptional).toBeFalse();
      expect(decl.properties[1].name).toBe('nullableObject');
      expect(decl.properties[1].type).withContext('nullableObject property').toBe('null | NullableObject');
      expect(decl.properties[1].isOptional).toBeFalse();
      expect(decl.properties[2].name).toBe('withNullableProperty');
      expect(decl.properties[2].type).withContext('withNullableProperty property').toBe('{ \'someProperty\': null | NullableObject }');
      expect(decl.properties[2].isOptional).toBeFalse();
      done();
    });
  });


  it('InlineObject model', done => {
    const ref = gen.models.get('InlineObject');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(1);
      expect(ast.imports.find(i => i.libraryName === './ref-enum')).withContext('ref-enum import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('InlineObject');
      expect(decl.properties.length).toBe(1);
      const prop = decl.properties[0];
      expect(prop.name).toBe('object');
      expect(prop.type).withContext('object property').toBe('{ \'string\'?: string, \'nullableString\'?: string | null, \'ref\'?: RefEnum, \'nullableRef\'?: RefEnum | null }');
      expect(prop.isOptional).toBeTrue();
      done();
    });
  });

  it('Container model', done => {
    const container = gen.models.get('Container');
    const ts = gen.templates.apply('model', container);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(6);
      expect(ast.imports.find(i => i.libraryName === './ref-enum')).withContext('ref-enum import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName === './a/b/ref-object')).withContext('a/b/ref-object import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName === './x/y/ref-object')).withContext('x/y/ref-object import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName === './union')).withContext('union import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName === './disjunct')).withContext('disjunct import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName === './nullable-object')).withContext('nullable-object import').toBeDefined();

      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('Container');
      expect(decl.properties.length).toBe(23);

      // Assert the simple types
      function assertProperty(name: string, type: string, required = false) {
        const prop = decl.properties.find(p => p.name === name);
        expect(prop).withContext(`${name} property`).toBeDefined();
        if (prop) {
          expect(prop.type).withContext(`${name} type`).toEqual(type);
          expect(prop.isOptional).withContext(`${name} required`).toBe(!required);
        }
      }
      assertProperty('stringProp', 'string');
      assertProperty('integerProp', 'number');
      assertProperty('numberProp', 'number', true);
      assertProperty('booleanProp', 'boolean');
      assertProperty('anyProp', 'any');

      assertProperty('nullableObject', 'null | NullableObject');
      assertProperty('refEnumProp', 'RefEnum', true);
      assertProperty('refObjectProp', 'ABRefObject', true);
      assertProperty('unionProp', 'Union');
      assertProperty('containerProp', 'Container');
      assertProperty('arrayOfStringsProp', 'Array<string>');
      assertProperty('arrayOfIntegersProp', 'Array<number>');
      assertProperty('arrayOfNumbersProp', 'Array<number>');
      assertProperty('arrayOfBooleansProp', 'Array<boolean>');
      assertProperty('arrayOfRefEnumsProp', 'Array<RefEnum>');
      assertProperty('arrayOfABRefObjectsProp', 'Array<ABRefObject>');
      assertProperty('arrayOfAnyProp', 'Array<any>');
      assertProperty('nestedObject', '{ \'p1\'?: string, \'p2\'?: number, ' +
        '\'deeper\'?: { \'d1\': ABRefObject, \'d2\'?: (string | Array<ABRefObject> | number) } }');
      assertProperty('dynamic', '{ [key: string]: XYRefObject }');
      assertProperty('stringEnumProp', '\'a\' | \'b\' | \'c\'');
      assertProperty('intEnumProp', '1 | 2 | 3');
      assertProperty('boolEnumProp', 'false');

      done();
    });
  });

  it('Containers model', done => {
    const containers = gen.models.get('Containers');
    const ts = gen.templates.apply('model', containers);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.find(i => i.libraryName === './container')).withContext('container import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('Containers');
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toBe('export type Containers = Array<Container>;');
      done();
    });
  });

  it('EscapedProperties model', done => {
    const escaped = gen.models.get('EscapedProperties');
    const ts = gen.templates.apply('model', escaped);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('EscapedProperties');
      expect(decl.properties.length).toBe(3);
      expect(decl.properties[0].name).toBe('123');
      expect(decl.properties[1].name).toBe('=');
      expect(decl.properties[2].name).toBe('a-b');
      done();
    });
  });
});
