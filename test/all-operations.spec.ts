import { OpenAPIObject } from 'openapi3-ts';
import { NgOpenApiGen } from '../src/ng-openapi-gen';
import allOperationsSpec from './all-operations.json';

const gen = new NgOpenApiGen(allOperationsSpec as OpenAPIObject, { input: '', defaultTag: 'noTag' });

describe('Generation tests using all-operations.json', () => {

  it('Tags', () => {
    expect(gen.services.size).toBe(3);
  });

  it('Tag 1', () => {
    const tag1 = gen.services.get('tag1');
    expect(tag1).toBeDefined();
    if (!tag1) return;
    expect(tag1.operations.length).toBe(2);
  });

  it('Tag 2', () => {
    const tag2 = gen.services.get('tag2');
    expect(tag2).toBeDefined();
    if (!tag2) return;
    expect(tag2.operations.length).toBe(1);
  });

  it('No tag', () => {
    const noTag = gen.services.get('noTag');
    expect(noTag).toBeDefined();
    if (!noTag) return;
    expect(noTag.operations.length).toBe(2);
  });

  it('GET /path1', () => {
    const operation = gen.operations.get('path1Get');
    expect(operation).toBeDefined();
    if (!operation) return;
    expect(operation.tags).toContain('tag1');
    expect(operation.path).toBe('/path1');
    expect(operation.method).toBe('get');
    expect(operation.parameters.length).toBe(5); // 2 shared, 3 own
    const params = operation.parameters;
    expect(params[0].name).toBe('common1');
    expect(params[0].type).toBe('RefString');
    expect(params[0].in).toBe('query');
    expect(params[1].name).toBe('common2');
    expect(params[1].type).toBe('RefObject');
    expect(params[1].in).toBe('header');
    expect(params[2].name).toBe('get1');
    expect(params[2].type).toBe('RefString');
    expect(params[2].in).toBe('query');
    expect(params[3].name).toBe('get2');
    expect(params[3].type).toBe('number');
    expect(params[3].in).toBe('query');
    expect(params[4].name).toBe('get3');
    expect(params[4].type).toBe('boolean');
    expect(params[4].in).toBe('query');
    expect(operation.requestBody).toBeUndefined();
    expect(operation.allResponses.length).toBe(2);
    const success = operation.successResponse;
    expect(success).toBeDefined();
    if (success) {
      expect(success.statusCode).toBe('200');
      expect(success.content.length).toBe(2);
      const json = success.content.find(c => c.mediaType === 'application/json');
      expect(json).toBeDefined();
      if (json) {
        expect(json.type).toBe('RefObject');
      }
      const image = success.content.find(c => c.mediaType === 'image/*');
      expect(image).toBeDefined();
      if (image) {
        expect(image.type).toBe('Blob');
      }
    }
    const resp200 = operation.allResponses.find(r => r.statusCode === '200');
    expect(resp200).toBe(success);
    const respDefault = operation.allResponses.find(r => r.statusCode === 'default');
    expect(respDefault).toBeDefined();
    if (respDefault) {
      expect(respDefault.content.length).toBe(1);
      expect(respDefault.content[0].type).toBe('Error');
    }
  });

  it('POST /path1', () => {
    const operation = gen.operations.get('path1Post');
    expect(operation).toBeDefined();
    if (!operation) return;
    expect(operation.tags).toContain('tag2');
    expect(operation.path).toBe('/path1');
    expect(operation.method).toBe('post');
    expect(operation.parameters.length).toBe(3); // 2 shared, 1 own
    const params = operation.parameters;
    expect(params[0].name).toBe('common1');
    expect(params[0].type).toBe('RefString');
    expect(params[0].in).toBe('query');
    expect(params[1].name).toBe('common2');
    expect(params[1].type).toBe('RefObject');
    expect(params[1].in).toBe('header');
    expect(params[2].name).toBe('post1');
    expect(params[2].type).toBe('number');
    expect(params[2].in).toBe('query');
    expect(operation.requestBody).withContext('request body').toBeDefined();
    if (operation.requestBody) {
      expect(operation.requestBody.required).toBe(true);
      expect(operation.requestBody.content.length).toBe(2);
      const json = operation.requestBody.content.find(c => c.mediaType === 'application/json');
      expect(json).toBeDefined();
      if (json) {
        expect(json.type).toBe('RefObject');
      }
      const plain = operation.requestBody.content.find(c => c.mediaType === 'text/plain');
      expect(plain).toBeDefined();
      if (plain) {
        expect(plain.type).toBe('string');
      }
    }
    expect(operation.variants.length).toBe(2);
    expect(operation.allResponses.length).toBe(0);
  });

  it('GET /path2/{id}', () => {
    const operation = gen.operations.get('path2Get');
    expect(operation).toBeDefined();
    if (!operation) return;
    expect(operation.tags).toContain('tag1');
    expect(operation.path).toBe('/path2/{id}');
    expect(operation.method).toBe('get');
    expect(operation.parameters.length).toBe(3); // The cookie parameter is ignored
    const params = operation.parameters;
    expect(params[0].name).toBe('id');
    expect(params[0].type).toBe('number');
    expect(params[0].in).toBe('path');
    expect(params[1].name).toBe('param1');
    expect(params[1].type).toBe('RefString');
    expect(params[1].in).toBe('query');
    expect(params[2].name).toBe('param2');
    expect(params[2].type).toBe('string');
    expect(params[2].in).toBe('header');
    expect(operation.requestBody).withContext('request body').toBeUndefined();
    expect(operation.variants.length).toBe(1);
    expect(operation.allResponses.length).toBe(0);
  });

  it('DELETE /path3/{id}', () => {
    const operation = gen.operations.get('path3Del');
    expect(operation).toBeDefined();
    if (!operation) return;
    expect(operation.tags).toContain('noTag');
    expect(operation.path).toBe('/path3/{id}');
    expect(operation.method).toBe('delete');
    expect(operation.parameters.length).toBe(1); // 1 common
    const params = operation.parameters;
    expect(params[0].name).toBe('id');
    expect(params[0].type).toBe('number');
    expect(params[0].in).toBe('path');
    expect(operation.requestBody).withContext('request body').toBeUndefined();
    expect(operation.variants.length).toBe(1);
    expect(operation.allResponses.length).toBe(0);
  });

  it('PUT /path4', () => {
    const operation = gen.operations.get('path4Put'); // auto-generated
    expect(operation).toBeDefined();
    if (!operation) return;
    expect(operation.tags).toContain('noTag');
    expect(operation.path).toBe('/path4');
    expect(operation.method).toBe('put');
    expect(operation.parameters.length).toBe(0);
    expect(operation.requestBody).withContext('request body').toBeDefined();
    if (operation.requestBody) {
      expect(operation.requestBody.required).toBe(false);
      expect(operation.requestBody.content.length).toBe(3);
      const json = operation.requestBody.content.find(c => c.mediaType === 'application/json');
      expect(json).withContext('application/json request').toBeDefined();
      if (json) {
        expect(json.type).toBe('RefObject');
      }
      const plain = operation.requestBody.content.find(c => c.mediaType === 'text/plain');
      expect(plain).withContext('text/plain request').toBeDefined();
      if (plain) {
        expect(plain.type).toBe('string');
      }
      const image = operation.requestBody.content.find(c => c.mediaType === 'image/*');
      expect(image).withContext('image/* request').toBeDefined();
      if (image) {
        expect(image.type).toBe('Blob');
      }
    }
    expect(operation.variants.length).toBe(6); // 3 request bodies x 2 success responses
    expect(operation.allResponses.length).toBe(4);
    const success = operation.successResponse;
    expect(success).toBeDefined();
    if (success) {
      expect(success.statusCode).toBe('200');
      expect(success.content.length).toBe(2);
      const plain = success.content.find(c => c.mediaType === 'text/plain');
      expect(plain).toBeDefined();
      if (plain) {
        expect(plain.type).toBe('string');
      }
      const image = success.content.find(c => c.mediaType === 'image/*');
      expect(image).toBeDefined();
      if (image) {
        expect(image.type).toBe('Blob');
      }
    }
    const resp200 = operation.allResponses.find(r => r.statusCode === '200');
    expect(resp200).toBe(success);
    const resp401 = operation.allResponses.find(r => r.statusCode === '404');
    expect(resp401).toBeDefined();
    if (resp401) {
      expect(resp401.content.length).toBe(1);
      expect(resp401.content[0].type).toBe('string');
    }
    const resp404 = operation.allResponses.find(r => r.statusCode === '404');
    expect(resp404).toBeDefined();
    if (resp404) {
      expect(resp404.content.length).toBe(1);
      expect(resp404.content[0].type).toBe('string');
    }
    const resp500 = operation.allResponses.find(r => r.statusCode === '500');
    expect(resp500).toBeDefined();
    if (resp500) {
      expect(resp500.content.length).toBe(1);
      expect(resp500.content[0].type).toBe('Error');
    }
  });
});
