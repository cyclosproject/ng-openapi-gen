
import { ClassDeclaration, EnumDeclaration, InterfaceDeclaration, NamedExport, TypeAliasDeclaration, TypescriptParser } from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { Options } from '../lib/options';
import options from './all-types.config.json';
import allTypesSpec from './all-types.json';
import { OpenAPIObject } from '../lib/openapi-typings';
const spec = allTypesSpec as unknown as OpenAPIObject;

const gen = new NgOpenApiGen(spec, options as Options);
gen.generate();

it('Api', () => {
  const api = gen.services.get('Api');
  expect(api).toBeDefined();
  if (api) {
    const ts = gen.templates.apply('service', api);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(ClassDeclaration));
      const cls = ast.declarations[0] as ClassDeclaration;
      expect(cls.methods.length).toEqual(3 * 2); // foo, bar, baz, in 2 variants each
      // Should have imported referenced-in-service-one-of-1/2
      expect(ast.imports.find(i => i.libraryName.endsWith('/models/referenced-in-service-one-of-1'))).toBeDefined();
      expect(ast.imports.find(i => i.libraryName.endsWith('/models/referenced-in-service-one-of-2'))).toBeDefined();
      // But not referenced-in-one-of, as it is nested within an object schema
      expect(ast.imports.find(i => i.libraryName.endsWith('/models/referenced-in-one-of'))).toBeUndefined();

    });
  }
});

describe('Generation tests using all-types.json', () => {
  it('RefEnum model', () => {
    const ref = gen.models.get('RefEnum');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(EnumDeclaration));
      const decl = ast.declarations[0] as EnumDeclaration;
      expect(decl.name).toBe('RefEnum');
      expect(decl.members.length).toBe(4);
      expect(decl.members[0]).toBe('ValueA');
      expect(decl.members[1]).toBe('ValueB');
      expect(decl.members[2]).toBe('ValueC');
      expect(decl.members[3]).toBe('_');

    });
  });

  it('RefIntEnum model', () => {
    const ref = gen.models.get('RefIntEnum');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(EnumDeclaration));
      const decl = ast.declarations[0] as EnumDeclaration;
      expect(decl.name).toBe('RefIntEnum');
      expect(decl.members.length).toBe(3);
      expect(decl.members[0]).toBe('$100');
      expect(decl.members[1]).toBe('$200');
      expect(decl.members[2]).toBe('$300');

    });
  });

  it('RefNamedIntEnum model', () => {
    const ref = gen.models.get('RefNamedIntEnum');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(EnumDeclaration));
      const decl = ast.declarations[0] as EnumDeclaration;
      expect(decl.name).toBe('RefNamedIntEnum');
      expect(decl.members.length).toBe(3);
      expect(decl.members[0]).toBe('first');
      expect(decl.members[1]).toBe('second');
      expect(decl.members[2]).toBe('third');

    });
  });

  it('NullableObject model', () => {
    const refObject = gen.models.get('NullableObject');
    const ts = gen.templates.apply('model', refObject);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('NullableObject');
      // There's no support for additional properties in typescript-parser. Check as text.
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toContain('= ({\n\'name\'?: string;\n})');

    });
  });

  it('a.b.RefObject model', () => {
    const refObject = gen.models.get('a.b.RefObject');
    const ts = gen.templates.apply('model', refObject);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('RefObject');
      expect(decl.properties.length).toBe(1);
      expect(decl.properties[0].type).toBe('string');

    });
  });

  it('x.y.RefObject model', () => {
    const otherObject = gen.models.get('x.y.RefObject');
    const ts = gen.templates.apply('model', otherObject);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(1);
      expect(ast.imports.find(i => i.libraryName.endsWith('/a/b/ref-object'))).toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('RefObject');
      // There's no support for additional properties in typescript-parser. Check as text.
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toContain('[key: string]: any');

    });
  });

  it('union model', () => {
    const union = gen.models.get('union');
    const ts = gen.templates.apply('model', union);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.find(i => i.libraryName.endsWith('/ref-enum'))).toBeDefined();
      expect(ast.imports.find(i => i.libraryName.endsWith('/container'))).toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('Union');
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toBe('export type Union = ({\n[key: string]: any;\n} | RefEnum | RefIntEnum | RefNamedIntEnum | Container);');

    });
  });

  it('disjunct model', () => {
    const disjunct = gen.models.get('disjunct');
    const ts = gen.templates.apply('model', disjunct);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(5);
      expect(ast.imports.find(i => i.libraryName.endsWith('/referenced-in-nullable-one-of'))).toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('Disjunct');
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toBe('export type Disjunct = ({\n\'ref\'?: ReferencedInNullableOneOf | null;\n} | ABRefObject | XYRefObject | ReferencedInOneOf | EscapedProperties);');

    });
  });

  it('ReferencedInOneOf model', () => {
    const ref = gen.models.get('ReferencedInOneOf');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('ReferencedInOneOf');
      expect(decl.properties.length).toBe(1);
      expect(decl.properties[0].name).toBe('name');
      expect(decl.properties[0].type).toBe('string');

    });
  });

  it('ReferencedInNullableOneOf model', () => {
    const ref = gen.models.get('ReferencedInNullableOneOf');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('ReferencedInNullableOneOf');
      expect(decl.properties.length).toBe(1);
      expect(decl.properties[0].name).toBe('name');
      expect(decl.properties[0].type).toBe('string');

    });
  });

  it('ReferencedInServiceOneOf1 model', () => {
    const ref = gen.models.get('ReferencedInServiceOneOf1');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('ReferencedInServiceOneOf1');
      expect(decl.properties.length).toBe(1);
      expect(decl.properties[0].name).toBe('name');
      expect(decl.properties[0].type).toBe('string');

    });
  });

  it('ReferencedInServiceOneOf2 model', () => {
    const ref = gen.models.get('ReferencedInServiceOneOf2');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('ReferencedInServiceOneOf2');
      expect(decl.properties.length).toBe(1);
      expect(decl.properties[0].name).toBe('name');
      expect(decl.properties[0].type).toBe('string');

    });
  });

  it('ReferencedInParamOneOf1 model', () => {
    const ref = gen.models.get('ReferencedInParamOneOf1');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('ReferencedInParamOneOf1');
      expect(decl.properties.length).toBe(1);
      expect(decl.properties[0].name).toBe('name');
      expect(decl.properties[0].type).toBe('string');

    });
  });

  it('ReferencedInParamOneOf2 model', () => {
    const ref = gen.models.get('ReferencedInParamOneOf2');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('ReferencedInParamOneOf2');
      expect(decl.properties.length).toBe(1);
      expect(decl.properties[0].name).toBe('name');
      expect(decl.properties[0].type).toBe('string');

    });
  });

  it('AdditionalProperties model', () => {
    const ref = gen.models.get('AdditionalProperties');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(1);
      expect(ast.imports.find(i => i.libraryName.endsWith('/a/b/ref-object'))).toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('AdditionalProperties');
      expect(decl.properties.length).toBe(3);
      expect(decl.properties[0].name).toBe('age');
      expect(decl.properties[0].type).toBe('number | null');
      expect(decl.properties[1].name).toBe('description');
      expect(decl.properties[1].type).toBe('string');
      expect(decl.properties[2].name).toBe('name');
      expect(decl.properties[2].type).toBe('string');
      expect(decl.properties[2].isOptional).toBe(false);
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toContain('[key: string]: ABRefObject | number | null | string | undefined;');

    });
  });

  it('Nullables model', () => {
    const ref = gen.models.get('Nullables');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(1);
      expect(ast.imports.find(i => i.libraryName.endsWith('/nullable-object'))).toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('Nullables');
      expect(decl.properties.length).toBe(3);
      expect(decl.properties[0].name).toBe('inlinedNullableObject');
      expect(decl.properties[0].type).toBe('({\n\'someProperty\': string;\n}) | null');
      expect(decl.properties[0].isOptional).toBe(false);
      expect(decl.properties[1].name).toBe('nullableObject');
      expect(decl.properties[1].type).toBe('NullableObject | null');
      expect(decl.properties[1].isOptional).toBe(false);
      expect(decl.properties[2].name).toBe('withNullableProperty');
      expect(decl.properties[2].type).toBe('{\n\'someProperty\': NullableObject | null;\n}');
      expect(decl.properties[2].isOptional).toBe(false);

    });
  });


  it('InlineObject model', () => {
    const ref = gen.models.get('InlineObject');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(1);
      expect(ast.imports.find(i => i.libraryName.endsWith('/ref-enum'))).toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('InlineObject');
      expect(decl.properties.length).toBe(1);
      const prop = decl.properties[0];
      expect(prop.name).toBe('object');
      expect(prop.type).toBe('{\n\'string\'?: string;\n\'nullableString\'?: string | null;\n\'ref\'?: RefEnum;\n\'nullableRef\'?: RefEnum | null;\n}');
      expect(prop.isOptional).toBe(true);

    });
  });

  it('Container model', () => {
    const container = gen.models.get('Container');
    const ts = gen.templates.apply('model', container);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(6);
      expect(ast.imports.find(i => i.libraryName.endsWith('/ref-enum'))).toBeDefined();
      expect(ast.imports.find(i => i.libraryName.endsWith('/a/b/ref-object'))).toBeDefined();
      expect(ast.imports.find(i => i.libraryName.endsWith('/x/y/ref-object'))).toBeDefined();
      expect(ast.imports.find(i => i.libraryName.endsWith('/union'))).toBeDefined();
      expect(ast.imports.find(i => i.libraryName.endsWith('/disjunct'))).toBeDefined();
      expect(ast.imports.find(i => i.libraryName.endsWith('/nullable-object'))).toBeDefined();

      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(TypeAliasDeclaration));
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
          expect.fail(`Property not found: ${name}`);
        }
        const textFromProperty = text.substring(idx);
        const start = textFromProperty.indexOf(':');
        const end = findEndOfType(textFromProperty);
        expect(textFromProperty.substring(start + 1, end).trim()).toBe(type);

        // Test for required or optional
        const requiredToken = textFromProperty.charAt(start - 1);
        if (required) {
          expect(requiredToken).not.toBe('?');
        } else {
          expect(requiredToken).toBe('?');
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


    });
  });

  it('Containers model', () => {
    const containers = gen.models.get('Containers');
    const ts = gen.templates.apply('model', containers);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.find(i => i.libraryName.endsWith('/container'))).toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('Containers');
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toBe('export type Containers = Array<Container>;');

    });
  });

  it('EscapedProperties model', () => {
    const escaped = gen.models.get('EscapedProperties');
    const ts = gen.templates.apply('model', escaped);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('EscapedProperties');
      expect(decl.properties.length).toBe(3);
      expect(decl.properties[0].name).toBe('123');
      expect(decl.properties[1].name).toBe('=');
      expect(decl.properties[2].name).toBe('a-b');

    });
  });

  it('AuditLog model', () => {
    const audit = gen.models.get('AuditLog');
    const ts = gen.templates.apply('model', audit);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(0);
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
      const decl = ast.declarations[0] as InterfaceDeclaration;
      expect(decl.name).toBe('AuditLog');
      expect(decl.properties.length).toBe(4);
      expect(decl.properties[0].name).toBe('date');
      expect(decl.properties[1].name).toBe('id');
      expect(decl.properties[2].name).toBe('text');
      expect(decl.properties[3].name).toBe('type');
      expect(decl.properties[3].isOptional).toBe(false);

    });
  });

  it('AuditCdr model', () => {
    const audit = gen.models.get('AuditCdr');
    const ts = gen.templates.apply('model', audit);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(1);
      expect(ast.imports.find(i => i.libraryName.endsWith('/audit-log'))).toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('AuditCdr');
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toContain('AuditCdr = AuditLog & {');
      expect(text).toContain('\'callEndDate\'?: string');
      expect(text).toContain('\'callFrom\'?: string');
      expect(text).toContain('\'callStartDate\'?: string');
      expect(text).toContain('\'callTo\'?: string');

    });
  });

  it('Circle model', () => {
    const audit = gen.models.get('Circle');
    const ts = gen.templates.apply('model', audit);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.imports.length).toBe(1);
      expect(ast.imports.find(i => i.libraryName.endsWith('/shape'))).toBeDefined();
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(expect.any(TypeAliasDeclaration));
      const decl = ast.declarations[0] as TypeAliasDeclaration;
      expect(decl.name).toBe('Circle');
      const text = ts.substring(decl.start || 0, decl.end || ts.length);
      expect(text).toContain('Circle = Shape & {');
      expect(text).toContain('\'radius\'?: number');

    });
  });

  it('index file', () => {
    const ref = gen.models.get('InlineObject');
    const ts = gen.templates.apply('index', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.exports.length).toBe(6);
      expect(ast.exports.find((ex: NamedExport) => ex.from === './api-configuration')).toBeDefined();
      expect(ast.exports.find((ex: NamedExport) => ex.from === './base-service')).toBeDefined();
      expect(ast.exports.find((ex: NamedExport) => ex.from === './request-builder')).toBeDefined();
      expect(ast.exports.find((ex: NamedExport) => ex.from === './strict-http-response')).toBeDefined();
      expect(ast.exports.find((ex: NamedExport) => ex.from === './all-types.module')).toBeDefined();
    });
  });
});
