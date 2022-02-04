import { OpenAPIObject } from 'openapi3-ts';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import defaultSuccessResponseSpec from './default-success-response.json';



describe('Generation tests using default-success-response.json', () => {
  let gen: NgOpenApiGen;

  beforeEach(() => {
    gen = new NgOpenApiGen(defaultSuccessResponseSpec as OpenAPIObject, { input: 'default-success-response.json' });
    gen.generate();
  });

  it('GET /path1 - default response can be a successResponse', () => {
    const operation = gen.operations.get('getPath1');
    expect(operation).toBeDefined();
    if (!operation) return;
    expect(operation.path).toBe('/path1');
    expect(operation.method).toBe('get');
    expect(operation.requestBody).toBeUndefined();
    expect(operation.allResponses.length).toBe(1);
    const success = operation.successResponse;
    expect(success).toBeDefined();
    if (!success) return;
    expect(success.statusCode).toBe('default');
    const json = success.content.find(c => c.mediaType === 'application/json');
    expect(json).toBeDefined();
    if (json) {
      expect(json.type).toBe('string');
    }
  });

  it('GET /path2 - default response should not overwrite other successResponse', () => {
    const operation = gen.operations.get('getPath2');
    expect(operation).toBeDefined();
    if (!operation) return;
    expect(operation.path).toBe('/path2');
    expect(operation.method).toBe('get');
    expect(operation.requestBody).toBeUndefined();
    expect(operation.allResponses.length).toBe(2);
    const success = operation.successResponse;
    expect(success).toBeDefined();
    if (!success) return;
    expect(success.statusCode).toBe('200');
    const json = success.content.find(c => c.mediaType === 'application/json');
    expect(json).toBeDefined();
    if (json) {
      expect(json.type).toBe('number');
    }
  });
});
