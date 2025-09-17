import { ClassDeclaration, InterfaceDeclaration, TypescriptParser } from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { Options } from '../lib/options';
import jsonschemaSpec from './openapi31-jsonschema.json';
import { OpenAPIObject } from '../lib/openapi-typings';
const spec = jsonschemaSpec as OpenAPIObject;

const root = __dirname;

describe('OpenAPI 3.1 JSON Schema Features Tests', () => {
  let gen: NgOpenApiGen;

  beforeEach(() => {
    gen = new NgOpenApiGen(spec, {
      output: root + '/../out/openapi31-jsonschema',
    } as Options);
    gen.generate();
  });

  it('should handle prefixItems as tuple types', done => {
    const model = gen.models.get('AdvancedSchemaFeatures');
    expect(model).toBeDefined();
    if (model) {
      const ts = gen.templates.apply('model', model);
      const parser = new TypescriptParser();
      parser.parseSource(ts).then(ast => {
        expect(ast.declarations.length).toBe(1);
        expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
        const decl = ast.declarations[0] as InterfaceDeclaration;

        // Check tupleArray property - should be tuple type [string, number, boolean]
        const tupleArrayProp = decl.properties.find(p => p.name === 'tupleArray');
        expect(tupleArrayProp).toBeDefined();
        // OpenAPI 3.1 prefixItems now correctly generates tuple types
        expect(tupleArrayProp?.type).toContain('[string, number, boolean]');

        done();
      });
    }
  });

  it('should handle discriminator with mapping', done => {
    const model = gen.models.get('Dog');
    expect(model).toBeDefined();
    if (model) {
      const ts = gen.templates.apply('model', model);
      const parser = new TypescriptParser();
      parser.parseSource(ts).then(ast => {
        const decl = ast.declarations[0] as InterfaceDeclaration;
        expect(decl.name).toBe('Dog');

        // Check pet_type property - should be const "dog"
        const petTypeProp = decl.properties.find(p => p.name === 'pet_type');
        expect(petTypeProp).toBeDefined();
        expect(petTypeProp?.type).toContain('dog');

        // Check breed property - should be enum
        const breedProp = decl.properties.find(p => p.name === 'breed');
        expect(breedProp).toBeDefined();
        expect(breedProp?.type).toContain('Dingo');
        expect(breedProp?.type).toContain('Husky');
        expect(breedProp?.type).toContain('Retriever');

        done();
      });
    }
  });

  it('should handle Cat model properly', done => {
    const model = gen.models.get('Cat');
    expect(model).toBeDefined();
    if (model) {
      const ts = gen.templates.apply('model', model);
      const parser = new TypescriptParser();
      parser.parseSource(ts).then(ast => {
        const decl = ast.declarations[0] as InterfaceDeclaration;
        expect(decl.name).toBe('Cat');

        // Check pet_type property - should be const "cat"
        const petTypeProp = decl.properties.find(p => p.name === 'pet_type');
        expect(petTypeProp).toBeDefined();
        expect(petTypeProp?.type).toContain('cat');

        done();
      });
    }
  });

  it('should handle ResponseWithDiscriminator as union type', done => {
    const model = gen.models.get('ResponseWithDiscriminator');
    expect(model).toBeDefined();
    if (model) {
      const ts = gen.templates.apply('model', model);
      const parser = new TypescriptParser();
      parser.parseSource(ts).then(ast => {
        const decl = ast.declarations[0] as InterfaceDeclaration;
        expect(decl.name).toBe('ResponseWithDiscriminator');

        // Should reference Dog and Cat types
        expect(ts).toContain('Dog');
        expect(ts).toContain('Cat');

        done();
      });
    }
  });

  it('should handle ArrayWithContains model', done => {
    const model = gen.models.get('ArrayWithContains');
    expect(model).toBeDefined();
    if (model) {
      const ts = gen.templates.apply('model', model);
      const parser = new TypescriptParser();
      parser.parseSource(ts).then(ast => {
        const decl = ast.declarations[0] as InterfaceDeclaration;
        expect(decl.name).toBe('ArrayWithContains');

        // Check mixedArray property - should handle contains constraint
        const mixedArrayProp = decl.properties.find(p => p.name === 'mixedArray');
        expect(mixedArrayProp).toBeDefined();
        // TODO: contains is advanced feature, may fall back to basic array
        expect(mixedArrayProp?.type).toContain('Array');

        done();
      });
    }
  });

  it('should generate service with testSchemaFeatures method', done => {
    const service = gen.services.get('Api');
    expect(service).toBeDefined();
    if (service) {
      const ts = gen.templates.apply('service', service);
      const parser = new TypescriptParser();
      parser.parseSource(ts).then(ast => {
        expect(ast.declarations.length).toBe(1);
        expect(ast.declarations[0]).toEqual(jasmine.any(ClassDeclaration));
        const cls = ast.declarations[0] as ClassDeclaration;

        // Should have testSchemaFeatures method
        const testSchemaFeaturesMethod = cls.methods.find(m => m.name.includes('testSchemaFeatures'));
        expect(testSchemaFeaturesMethod).toBeDefined();

        done();
      });
    }
  });
});
