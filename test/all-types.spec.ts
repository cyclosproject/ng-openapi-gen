import { OpenAPIObject } from '@loopback/openapi-v3-types';
import { ClassDeclaration, EnumDeclaration, InterfaceDeclaration, NamedExport, TypeAliasDeclaration, TypescriptParser } from 'typescript-parser';
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
      expect(ast.imports.find(i => i.libraryName.endsWith('/models/referenced-in-service-one-of-1'))).withContext('ref1 import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName.endsWith('/models/referenced-in-service-one-of-2'))).withContext('ref2 import').toBeDefined();
      // But not referenced-in-one-of, as it is nested within an object schema
      expect(ast.imports.find(i => i.libraryName.endsWith('/models/referenced-in-one-of'))).withContext('ref import').toBeUndefined();
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
      expect(ast.declarations[0]).toEqual(jasmine.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('NullableObject');
      // There's no support for additional properties in typescript-parser. Check as text.
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toContain('= ({\n\'name\'?: string;\n})');
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
      expect(ast.imports.find(i => i.libraryName.endsWith('/a/b/ref-object'))).withContext('a/b/ref-object import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('RefObject');
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
      expect(ast.imports.find(i => i.libraryName.endsWith('/ref-enum'))).withContext('ref-enum import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName.endsWith('/container'))).withContext('container import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('Union');
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toBe('export type Union = ({\n[key: string]: any;\n} | RefEnum | RefIntEnum | RefNamedIntEnum | Container);');
      done();
    });
  });

  it('disjunct model', done => {
    const disjunct = gen.models.get('disjunct');
    const ts = gen.templates.apply('model', disjunct);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(5);
      expect(ast.imports.find(i => i.libraryName.endsWith('/referenced-in-nullable-one-of'))).withContext('referenced-in-nullable-one-of import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('Disjunct');
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toBe('export type Disjunct = ({\n\'ref\'?: ReferencedInNullableOneOf | null;\n} | ABRefObject | XYRefObject | ReferencedInOneOf | EscapedProperties);');
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
      expect(ast.imports.find(i => i.libraryName.endsWith('/a/b/ref-object'))).withContext('a/b/ref-object import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('AdditionalProperties');
      expect(decl.properties.length).toBe(3);
      expect(decl.properties[0].name).toBe('age');
      expect(decl.properties[0].type).toBe('number | null');
      expect(decl.properties[1].name).toBe('description');
      expect(decl.properties[1].type).toBe('string');
      expect(decl.properties[2].name).toBe('name');
      expect(decl.properties[2].type).toBe('string');
      expect(decl.properties[2].isOptional).toBeFalse();
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toContain('[key: string]: ABRefObject | number | null | string | undefined;');
      done();
    });
  });

  it('Nullables model', done => {
    const ref = gen.models.get('Nullables');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(1);
      expect(ast.imports.find(i => i.libraryName.endsWith('/nullable-object'))).withContext('nullable-object import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('Nullables');
      expect(decl.properties.length).toBe(3);
      expect(decl.properties[0].name).toBe('inlinedNullableObject');
      expect(decl.properties[0].type).withContext('inlinedNullableObject property').toBe('({\n\'someProperty\': string;\n}) | null');
      expect(decl.properties[0].isOptional).toBeFalse();
      expect(decl.properties[1].name).toBe('nullableObject');
      expect(decl.properties[1].type).withContext('nullableObject property').toBe('NullableObject | null');
      expect(decl.properties[1].isOptional).toBeFalse();
      expect(decl.properties[2].name).toBe('withNullableProperty');
      expect(decl.properties[2].type).withContext('withNullableProperty property').toBe('{\n\'someProperty\': NullableObject | null;\n}');
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
      expect(ast.imports.find(i => i.libraryName.endsWith('/ref-enum'))).withContext('ref-enum import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('InlineObject');
      expect(decl.properties.length).toBe(1);
      const prop = decl.properties[0];
      expect(prop.name).toBe('object');
      expect(prop.type).withContext('object property').toBe('{\n\'string\'?: string;\n\'nullableString\'?: string | null;\n\'ref\'?: RefEnum;\n\'nullableRef\'?: RefEnum | null;\n}');
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
      expect(ast.imports.find(i => i.libraryName.endsWith('/ref-enum'))).withContext('ref-enum import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName.endsWith('/a/b/ref-object'))).withContext('a/b/ref-object import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName.endsWith('/x/y/ref-object'))).withContext('x/y/ref-object import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName.endsWith('/union'))).withContext('union import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName.endsWith('/disjunct'))).withContext('disjunct import').toBeDefined();
      expect(ast.imports.find(i => i.libraryName.endsWith('/nullable-object'))).withContext('nullable-object import').toBeDefined();

      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('Container');
      const text = ts.substring(decl.start || 0, decl.end || ts.length);

      function findEndOfType(substr: string) {
        let recursion = 0;
        let i = 0;
        for (i = 0; i < substr.length; i++) {
          switch (substr.charAt(i)) {
            case '{':
              recursion++;
              break;
            case '}':
              if (--recursion < 0) {
                return i;
              }
              break;
            case ';':
              if (recursion === 0) {
                return i;
              }
              break;
          }
        }
        return i;
      }

      // Assert the simple types
      function assertProperty(name: string, type: string, required = false) {
        const idx = text.indexOf(name);
        if (idx === -1) {
          fail(`Property not found: ${name}`);
        }
        const textFromProperty = text.substring(idx);
        const start = textFromProperty.indexOf(':');
        const end = findEndOfType(textFromProperty);
        expect(textFromProperty.substring(start + 1, end).trim()).withContext(`${name} type`).toBe(type);

        // Test for required or optional
        const requiredToken = textFromProperty.charAt(start - 1);
        if (required) {
          expect(requiredToken).withContext(`${name} required`).not.toBe('?');
        } else {
          expect(requiredToken).withContext(`${name} optional`).toBe('?');
        }
      }
      assertProperty('stringProp', 'string');
      assertProperty('integerProp', 'number');
      assertProperty('numberProp', 'number', true);
      assertProperty('booleanProp', 'boolean');
      assertProperty('anyProp', 'any');

      assertProperty('nullableObject', 'NullableObject | null');
      assertProperty('refEnumProp', 'RefEnum', true);
      assertProperty('refObjectProp', 'ABRefObject', true);
      assertProperty('unionProp', 'Union');
      assertProperty('containerProp', 'Container');
      assertProperty('arrayOfStringsProp', 'Array<string>');
      assertProperty('arrayOfNullableStringsProp', 'Array<string | null>');
      assertProperty('arrayOfIntegersProp', 'Array<number>');
      assertProperty('arrayOfNumbersProp', 'Array<number>');
      assertProperty('arrayOfBooleansProp', 'Array<boolean>');
      assertProperty('arrayOfRefEnumsProp', 'Array<RefEnum>');
      assertProperty('arrayOfABRefObjectsProp', 'Array<ABRefObject>');
      assertProperty('arrayOfAnyProp', 'Array<any>');
      assertProperty('nestedObject', '{\n\'p1\'?: string;\n\'p2\'?: number;\n' +
        '\'deeper\'?: {\n\'d1\': ABRefObject;\n\'d2\'?: (string | Array<ABRefObject> | number);\n};\n}');
      assertProperty('dynamic', '{\n[key: string]: XYRefObject;\n}');
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
      expect(ast.imports.find(i => i.libraryName.endsWith('/container'))).withContext('container import').toBeDefined();
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

  it('AuditLog model', done => {
    const audit = gen.models.get('AuditLog');
    const ts = gen.templates.apply('model', audit);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('AuditLog');
      expect(decl.properties.length).toBe(4);
      expect(decl.properties[0].name).toBe('date');
      expect(decl.properties[1].name).toBe('id');
      expect(decl.properties[2].name).toBe('text');
      expect(decl.properties[3].name).toBe('type');
      expect(decl.properties[3].isOptional).toBeFalse();
      done();
    });
  });

  it('AuditCdr model', done => {
    const audit = gen.models.get('AuditCdr');
    const ts = gen.templates.apply('model', audit);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(1);
      expect(ast.imports.find(i => i.libraryName.endsWith('/audit-log'))).withContext('audit-log import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('AuditCdr');
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toContain('AuditCdr = AuditLog & {');
      expect(text).toContain('\'callEndDate\'?: string');
      expect(text).toContain('\'callFrom\'?: string');
      expect(text).toContain('\'callStartDate\'?: string');
      expect(text).toContain('\'callTo\'?: string');
      done();
    });
  });

  it('Circle model', done => {
    const audit = gen.models.get('Circle');
    const ts = gen.templates.apply('model', audit);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(1);
      expect(ast.imports.find(i => i.libraryName.endsWith('/shape'))).withContext('shape import').toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('Circle');
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toContain('Circle = Shape & {');
      expect(text).toContain('\'radius\'?: number');
      done();
    });
  });

  it('index file', done => {
    const ref = gen.models.get('InlineObject');
    const ts = gen.templates.apply('index', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.exports.length).withContext('Has the correct number of exports').toBe(5);
      expect(ast.exports.some((ex: NamedExport) => ex.from === './api-configuration')).withContext('Has an ApiConfiguration export').toBeDefined();
      expect(ast.exports.some((ex: NamedExport) => ex.from === './base-service')).withContext('Has a BaseService export').toBeDefined();
      expect(ast.exports.some((ex: NamedExport) => ex.from === './request-builder')).withContext('Has a RequestBuilder export').toBeDefined();
      expect(ast.exports.some((ex: NamedExport) => ex.from === './strict-http-response')).withContext('Has a StrictHttpResponse export').toBeDefined();
      expect(ast.exports.some((ex: NamedExport) => ex.from === './api.module')).withContext('Has an ApiModule export').toBeDefined();
      done();
    });
  });
});
