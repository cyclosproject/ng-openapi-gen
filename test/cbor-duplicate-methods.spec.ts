import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import options from './cbor-duplicate-methods.config.json';
import cborSpec from './cbor-duplicate-methods.json';
import * as fs from 'fs';
import { Options } from '../lib/options';
import { OpenAPIObject } from '../lib/openapi-typings';

const spec = cborSpec as unknown as OpenAPIObject;

describe('Test CBOR duplicate methods issue', () => {

  it('should not generate duplicate methods when using application/cbor for both request and response', () => {
    const gen = new NgOpenApiGen(spec, {
      ...options,
      output: 'out/cbor-duplicate-methods/'
    } as Options);
    gen.generate();

    // Check that services are enabled
    expect(options.services).toBe(true);

    // Get the searchPost operation which uses application/cbor for both request and response
    const operation = gen.operations.get('searchPost');
    expect(operation).toBeDefined();
    if (!operation) return;

    expect(operation.path).toBe('/search');
    expect(operation.method).toBe('post');

    // Check request body
    expect(operation.requestBody).toBeDefined();
    if (operation.requestBody) {
      expect(operation.requestBody.content.length).toBe(1);
      expect(operation.requestBody.content[0].mediaType).toBe('application/cbor');
    }

    // Check success response
    expect(operation.successResponse).toBeDefined();
    if (operation.successResponse) {
      expect(operation.successResponse.content.length).toBe(1);
      expect(operation.successResponse.content[0].mediaType).toBe('application/cbor');
    }

    // The key test: check that only one variant is generated, not duplicates
    expect(operation.variants).toBeDefined();
    expect(operation.variants.length).toBe(1);

    // Check the variant method name
    const variant = operation.variants[0];
    expect(variant.methodName).toBe('searchPost$Cbor$Cbor');

    // Check that the generated service file contains the correct method
    const serviceFileContent = fs.readFileSync(fs.realpathSync(`${gen.outDir}/services/api.service.ts`), 'utf8');

    // Should contain exactly one searchPost method variant
    const searchPostMethods = serviceFileContent.match(/^\s+searchPost\$.*?\(/gm);
    expect(searchPostMethods).toBeDefined();
    if (searchPostMethods) {
      // Should have exactly 2 methods: searchPost$Cbor$Cbor and searchPost$Cbor$Cbor$Response
      expect(searchPostMethods.length).toBe(2);
      expect(serviceFileContent).toContain('searchPost$Cbor$Cbor(');
      expect(serviceFileContent).toContain('searchPost$Cbor$Cbor$Response(');
    }

    // Should NOT contain duplicate method declarations with the same signature
    const methodDeclarations = serviceFileContent.match(/^\s+searchPost\$Cbor\$Cbor\(/gm);
    expect(methodDeclarations?.length).toBe(1);
    const responseMethodDeclarations = serviceFileContent.match(/^\s+searchPost\$Cbor\$Cbor\$Response\(/gm);
    expect(responseMethodDeclarations?.length).toBe(1);
  });

  it('should generate proper variants for mixed content operation', () => {
    const gen = new NgOpenApiGen(spec, {
      ...options,
      output: 'out/cbor-duplicate-methods/'
    } as Options);
    gen.generate();

    const operation = gen.operations.get('mixedContent');
    expect(operation).toBeDefined();
    if (!operation) return;

    expect(operation.path).toBe('/mixed-content');
    expect(operation.method).toBe('post');

    // Should have 4 variants: Json-Json, Json-Cbor, Cbor-Json, Cbor-Cbor
    expect(operation.variants.length).toBe(4);

    const methodNames = operation.variants.map(v => v.methodName).sort();
    expect(methodNames).toEqual([
      'mixedContent$Cbor$Cbor',
      'mixedContent$Cbor$Json',
      'mixedContent$Json$Cbor',
      'mixedContent$Json$Json'
    ]);

    // Each variant should be unique
    const uniqueMethodNames = new Set(methodNames);
    expect(uniqueMethodNames.size).toBe(4);
  });

});
