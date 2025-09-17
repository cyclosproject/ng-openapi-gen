import { ClassDeclaration, InterfaceDeclaration, TypescriptParser } from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { Options } from '../lib/options';
import contentSpec from './openapi31-content.json';
import { OpenAPIObject } from '../lib/openapi-typings';
const spec = contentSpec as OpenAPIObject;

const root = __dirname;

describe('OpenAPI 3.1 Content Types and Formats Tests', () => {
  let gen: NgOpenApiGen;

  beforeEach(() => {
    gen = new NgOpenApiGen(spec, {
      output: root + '/../out/openapi31-content',
    } as Options);
    gen.generate();
  });

  it('should handle binary format correctly', done => {
    const model = gen.models.get('FileUpload');
    expect(model).toBeDefined();
    if (model) {
      const ts = gen.templates.apply('model', model);
      const parser = new TypescriptParser();
      parser.parseSource(ts).then(ast => {
        expect(ast.declarations.length).toBe(1);
        expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
        const decl = ast.declarations[0] as InterfaceDeclaration;

        // Check binaryData property - should handle binary format
        const binaryDataProp = decl.properties.find(p => p.name === 'binaryData');
        expect(binaryDataProp).toBeDefined();
        // Binary format correctly generates Blob type
        expect(binaryDataProp?.type).toContain('Blob');

        done();
      });
    }
  });

  it('should handle multiple union types properly', done => {
    const model = gen.models.get('JsonData');
    expect(model).toBeDefined();
    if (model) {
      const ts = gen.templates.apply('model', model);
      const parser = new TypescriptParser();
      parser.parseSource(ts).then(ast => {
        const decl = ast.declarations[0] as InterfaceDeclaration;

        // Check data property - should be object | Array<any> | string
        const dataProp = decl.properties.find(p => p.name === 'data');
        expect(dataProp).toBeDefined();
        expect(dataProp?.type).toContain('} | Array<any> | string');

        done();
      });
    }
  });

  it('should handle various string formats', done => {
    const model = gen.models.get('FormattedData');
    expect(model).toBeDefined();
    if (model) {
      const ts = gen.templates.apply('model', model);
      const parser = new TypescriptParser();
      parser.parseSource(ts).then(ast => {
        const decl = ast.declarations[0] as InterfaceDeclaration;

        // All formatted strings should still be typed as string
        const timestampProp = decl.properties.find(p => p.name === 'timestamp');
        expect(timestampProp).toBeDefined();
        expect(timestampProp?.type).toContain('string');

        const emailProp = decl.properties.find(p => p.name === 'email');
        expect(emailProp).toBeDefined();
        expect(emailProp?.type).toContain('string');

        const ipv6Prop = decl.properties.find(p => p.name === 'ipv6Address');
        expect(ipv6Prop).toBeDefined();
        expect(ipv6Prop?.type).toContain('string');

        done();
      });
    }
  });

  it('should handle numeric types and constraints', done => {
    const model = gen.models.get('NumericTypes');
    expect(model).toBeDefined();
    if (model) {
      const ts = gen.templates.apply('model', model);
      const parser = new TypescriptParser();
      parser.parseSource(ts).then(ast => {
        const decl = ast.declarations[0] as InterfaceDeclaration;

        // Check integer32 property
        const integer32Prop = decl.properties.find(p => p.name === 'integer32');
        expect(integer32Prop).toBeDefined();
        expect(integer32Prop?.type).toContain('number');

        // Check unionNumber property - should handle integer | number union
        const unionNumberProp = decl.properties.find(p => p.name === 'unionNumber');
        expect(unionNumberProp).toBeDefined();
        // TODO: Union types currently only use first type
        expect(unionNumberProp?.type).toContain('number');

        done();
      });
    }
  });

  it('should handle anyOf with enum and const', done => {
    const model = gen.models.get('StringConstraints');
    expect(model).toBeDefined();
    if (model) {
      const ts = gen.templates.apply('model', model);
      const parser = new TypescriptParser();
      parser.parseSource(ts).then(ast => {
        const decl = ast.declarations[0] as InterfaceDeclaration;

        // Check enumOrConst property - should include enum values and const
        const enumOrConstProp = decl.properties.find(p => p.name === 'enumOrConst');
        expect(enumOrConstProp).toBeDefined();
        expect(enumOrConstProp?.type).toContain('value1');
        expect(enumOrConstProp?.type).toContain('value2');
        expect(enumOrConstProp?.type).toContain('value3');
        expect(enumOrConstProp?.type).toContain('special_constant');

        done();
      });
    }
  });

  it('should generate service methods for all operations', done => {
    const service = gen.services.get('Api');
    expect(service).toBeDefined();
    if (service) {
      const ts = gen.templates.apply('service', service);
      const parser = new TypescriptParser();
      parser.parseSource(ts).then(ast => {
        expect(ast.declarations.length).toBe(1);
        expect(ast.declarations[0]).toEqual(jasmine.any(ClassDeclaration));
        const cls = ast.declarations[0] as ClassDeclaration;

        // Should have uploadFile method
        const uploadFileMethod = cls.methods.find(m => m.name.includes('uploadFile'));
        expect(uploadFileMethod).toBeDefined();

        // Should have getFormattedData method
        const getFormattedDataMethod = cls.methods.find(m => m.name.includes('getFormattedData'));
        expect(getFormattedDataMethod).toBeDefined();

        // Should have getNumericTypes method
        const getNumericTypesMethod = cls.methods.find(m => m.name.includes('getNumericTypes'));
        expect(getNumericTypesMethod).toBeDefined();

        // Should have getStringConstraints method
        const getStringConstraintsMethod = cls.methods.find(m => m.name.includes('getStringConstraints'));
        expect(getStringConstraintsMethod).toBeDefined();

        done();
      });
    }
  });
});
