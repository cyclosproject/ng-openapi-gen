import { ClassDeclaration, InterfaceDeclaration, TypescriptParser } from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { OpenAPIObject } from '../lib/openapi-typings';
import options from './openapi31-nullable.config.json';
import nullableSpec from './openapi31-nullable.json';
const spec = nullableSpec as OpenAPIObject;

const gen = new NgOpenApiGen(spec, options);
gen.generate();

describe('OpenAPI 3.1 Nullable Types Tests', () => {
  it('should generate NullableArrayResponse model with union types', () => {
    const model = gen.models.get('NullableArrayResponse');
    expect(model).toBeDefined();
    if (model) {
      const ts = gen.templates.apply('model', model);
      const parser = new TypescriptParser();
      parser.parseSource(ts).then(ast => {
        expect(ast.declarations.length).toBe(1);
        expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
        const decl = ast.declarations[0] as InterfaceDeclaration;
        expect(decl.name).toBe('NullableArrayResponse');

        // Check items property - should handle array | null union
        const itemsProp = decl.properties.find(p => p.name === 'items');
        expect(itemsProp).toBeDefined();
        expect(itemsProp?.type).toContain('Array<string> | null');

        // Check nullableString property - should handle string | null
        const nullableStringProp = decl.properties.find(p => p.name === 'nullableString');
        expect(nullableStringProp).toBeDefined();
        expect(nullableStringProp?.type).toContain('string');
      });
    }
  });

  it('should generate MixedTypesInput model with union and const types', () => {
    const model = gen.models.get('MixedTypesInput');
    expect(model).toBeDefined();
    if (model) {
      const ts = gen.templates.apply('model', model);
      const parser = new TypescriptParser();
      parser.parseSource(ts).then(ast => {
        const decl = ast.declarations[0] as InterfaceDeclaration;
        expect(decl.name).toBe('MixedTypesInput');

        // Check unionType property - should be string | number | boolean
        const unionTypeProp = decl.properties.find(p => p.name === 'unionType');
        expect(unionTypeProp).toBeDefined();
        expect(unionTypeProp?.type).toContain('string | number | boolean');        // Check constValue property - should be literal type
        const constValueProp = decl.properties.find(p => p.name === 'constValue');
        expect(constValueProp).toBeDefined();
        expect(constValueProp?.type).toContain('fixed_value');

        // Check enumWithNull property
        const enumWithNullProp = decl.properties.find(p => p.name === 'enumWithNull');
        expect(enumWithNullProp).toBeDefined();
        expect(enumWithNullProp?.type).toContain('option1');
        expect(enumWithNullProp?.type).toContain('option2');
      });
    }
  });

  it('should generate JsonSchemaTypes model with complex union types', () => {
    const model = gen.models.get('JsonSchemaTypes');
    expect(model).toBeDefined();
    if (model) {
      const ts = gen.templates.apply('model', model);
      const parser = new TypescriptParser();
      parser.parseSource(ts).then(ast => {
        const decl = ast.declarations[0] as InterfaceDeclaration;
        expect(decl.name).toBe('JsonSchemaTypes');

        // Check unionField property
        const unionFieldProp = decl.properties.find(p => p.name === 'unionField');
        expect(unionFieldProp).toBeDefined();
        expect(unionFieldProp?.type).toContain('string');

        // Check constField property
        const constFieldProp = decl.properties.find(p => p.name === 'constField');
        expect(constFieldProp).toBeDefined();
        expect(constFieldProp?.type).toContain('constant_value');
      });
    }
  });

  it('should generate API service with nullable operations', () => {
    const service = gen.services.get('Api');
    expect(service).toBeDefined();
    if (service) {
      const ts = gen.templates.apply('service', service);
      const parser = new TypescriptParser();
      parser.parseSource(ts).then(ast => {
        expect(ast.declarations.length).toBe(1);
        expect(ast.declarations[0]).toEqual(expect.any(ClassDeclaration));
        const cls = ast.declarations[0] as ClassDeclaration;

        // Should have getNullableArray method
        const getNullableArrayMethod = cls.methods.find(m => m.name.includes('getNullableArray'));
        expect(getNullableArrayMethod).toBeDefined();

        // Should have postMixedTypes method
        const postMixedTypesMethod = cls.methods.find(m => m.name.includes('postMixedTypes'));
        expect(postMixedTypesMethod).toBeDefined();
      });
    }
  });
});
