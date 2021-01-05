import { OpenAPIObject } from 'openapi3-ts';
import { ClassDeclaration, TypescriptParser } from 'typescript-parser';
import { Content } from '../lib/content';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { Options } from '../lib/options';
import options from './all-operations.config.json';
import allOperationsSpec from './all-operations.json';



describe('Generation tests using all-operations.json', () => {
  let gen: NgOpenApiGen;

  beforeEach(() => {
    gen = new NgOpenApiGen(allOperationsSpec as OpenAPIObject, options);
    gen.generate();
  });

  it('Root URL', () => {
    expect(gen.globals.rootUrl).toBe('/api/1.0');
  });

  it('Tags', () => {
    expect(gen.services.size).toBe(4);
  });

  it('Tag 1', done => {
    const tag1 = gen.services.get('tag1');
    expect(tag1).toBeDefined();
    if (!tag1) return;
    expect(tag1.operations.length).toBe(2);
    const ts = gen.templates.apply('service', tag1);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(ClassDeclaration));
      const cls = ast.declarations[0] as ClassDeclaration;
      function assertPath1Get(name: string) {
        const method = cls.methods.find(m => m.name === name);
        expect(method).withContext(`method ${name}`).toBeDefined();
        if (method) {
          expect(method.parameters.length).toBe(1);
          const type = method.parameters[0].type;
          expect(type).toContain('common1?: RefString');
          expect(type).toContain('common2: RefObject');
          expect(type).toContain('get1?: RefString');
          expect(type).toContain('get2?: number');
          expect(type).toContain('get3?: boolean');
        }
      }
      assertPath1Get('path1Get$Json$Response');
      assertPath1Get('path1Get$Json');
      assertPath1Get('path1Get$Image$Response');
      assertPath1Get('path1Get$Image');

      function assertPath2Get(name: string) {
        const method = cls.methods.find(m => m.name === name);
        expect(method).withContext(`method ${name}`).toBeDefined();
        if (method) {
          expect(method.parameters.length).toBe(1);
          const type = method.parameters[0].type;
          expect(type).toContain('param1?: RefString');
          expect(type).toContain('param2?: string');
          expect(type).not.toContain('param3'); // Cookie parameter ignored
        }
      }
      assertPath2Get('path2Get$Response');
      assertPath2Get('path2Get');

      done();
    });
  });

  it('Tag 2', done => {
    const tag2 = gen.services.get('tag2');
    expect(tag2).toBeDefined();
    if (!tag2) return;
    expect(tag2.operations.length).toBe(1);

    const ts = gen.templates.apply('service', tag2);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(ClassDeclaration));
      const cls = ast.declarations[0] as ClassDeclaration;
      function assertPath1Post(name: string, bodyType: string) {
        const method = cls.methods.find(m => m.name === name);
        expect(method).withContext(`method ${name}`).toBeDefined();
        if (method) {
          expect(method.parameters.length).toBe(1);
          const type = method.parameters[0].type;
          expect(type).toContain('common1?: RefString');
          expect(type).toContain('common2: RefObject');
          expect(type).toContain('post1?: number');
          expect(type).toContain('body: ' + bodyType);
        }
      }
      assertPath1Post('path1Post$Json$Response', 'RefObject');
      assertPath1Post('path1Post$Json', 'RefObject');
      assertPath1Post('path1Post$Plain$Response', 'string');
      assertPath1Post('path1Post$Plain', 'string');

      done();
    });
  });

  it('Tag with nesting', () => {
    const tagWithNesting = gen.services.get('tag.tag2.tag3.tag4.tag5');
    expect(tagWithNesting).toBeDefined();
    if (!tagWithNesting) return;

    expect(tagWithNesting.namespace).toBe('tag/tag2/tag3/tag4');
  });

  it('No tag', done => {
    const noTag = gen.services.get('noTag');
    expect(noTag).toBeDefined();
    if (!noTag) return;
    expect(noTag.operations.length).toBe(4);

    const ts = gen.templates.apply('service', noTag);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(1);
      expect(ast.declarations[0]).toEqual(jasmine.any(ClassDeclaration));
      const cls = ast.declarations[0] as ClassDeclaration;
      function assertPath3Del(name: string) {
        const method = cls.methods.find(m => m.name === name);
        expect(method).withContext(`method ${name}`).toBeDefined();
        if (method) {
          expect(method.parameters.length).toBe(1);
          const type = method.parameters[0].type;
          expect(type).toContain('id: number');
        }
      }
      assertPath3Del('path3Del$Response');
      assertPath3Del('path3Del');

      function assertPath4Put(name: string, bodyType: string) {
        const method = cls.methods.find(m => m.name === name);
        expect(method).withContext(`method ${name}`).toBeDefined();
        if (method) {
          expect(method.parameters.length).toBe(1);
          const type = method.parameters[0].type;
          expect(type).toContain('body?: ' + bodyType);
        }
      }
      assertPath4Put('path4Put$Json$Plain$Response', 'RefObject');
      assertPath4Put('path4Put$Json$Plain', 'RefObject');
      assertPath4Put('path4Put$Plain$Plain$Response', 'string');
      assertPath4Put('path4Put$Plain$Plain', 'string');
      assertPath4Put('path4Put$Any$Plain$Response', 'Blob');
      assertPath4Put('path4Put$Any$Plain', 'Blob');

      assertPath4Put('path4Put$Json$Image$Response', 'RefObject');
      assertPath4Put('path4Put$Json$Image', 'RefObject');
      assertPath4Put('path4Put$Plain$Image$Response', 'string');
      assertPath4Put('path4Put$Plain$Image', 'string');
      assertPath4Put('path4Put$Any$Image$Response', 'Blob');
      assertPath4Put('path4Put$Any$Image', 'Blob');

      const withQuotes = cls.methods.find(m => m.name === 'withQuotes');
      expect(withQuotes).withContext(`method withQuotes`).toBeDefined();

      done();
    });
  });

  it('GET /path1', () => {
    const operation = gen.operations.get('path1Get');
    expect(operation).toBeDefined();
    if (!operation) return;
    expect(operation.tags).toContain('tag1');
    expect(operation.path).toBe('/path1');
    expect(operation.method).toBe('get');
    expect(operation.parameters.length).toBe(9); // 2 shared, 7 own
    const params = operation.parameters;
    expect(params[0].name).toBe('common1');
    expect(params[0].type).toBe('RefString');
    expect(params[0].in).toBe('query');
    expect(params[1].name).toBe('common2');
    expect(params[1].in).toBe('header');
    expect(params[1].type).toBe('RefObject');
    expect(params[2].name).toBe('get1');
    expect(params[2].type).toBe('RefString');
    expect(params[2].in).toBe('query');
    expect(params[3].name).toBe('get2');
    expect(params[3].type).toBe('number');
    expect(params[3].in).toBe('query');
    expect(params[4].name).toBe('get3');
    expect(params[4].var).toBe('get3');
    expect(params[4].varAccess).toBe('.get3');
    expect(params[4].type).toBe('boolean');
    expect(params[4].in).toBe('query');
    expect(params[5].name).toBe('get4');
    expect(params[5].type).toBe('Array<string>');
    expect(params[5].style).toBe('form');
    expect(params[5].explode).toBe(false);
    expect(params[6].name).toBe('=');
    expect(params[6].var).toBe('\'=\'');
    expect(params[6].varAccess).toBe('[\'=\']');
    expect(params[6].type).toBe('string');
    expect(params[6].in).toBe('query');
    expect(params[7].name).toBe('123');
    expect(params[7].var).toBe('\'123\'');
    expect(params[7].varAccess).toBe('[\'123\']');
    expect(params[7].type).toBe('string');
    expect(params[7].in).toBe('query');
    expect(params[8].name).toBe('a-b');
    expect(params[8].var).toBe('\'a-b\'');
    expect(params[8].varAccess).toBe('[\'a-b\']');
    expect(params[8].type).toBe('string');
    expect(params[8].in).toBe('query');
    expect(operation.requestBody).toBeUndefined();
    expect(operation.allResponses.length).toBe(2);
    const success = operation.successResponse;
    expect(success).toBeDefined();
    if (success) {
      expect(success.statusCode).toBe('200');
      expect(success.content.length).toBe(4);
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
    expect(operation.allResponses.length).toBe(1);
    const success = operation.successResponse;
    expect(success).withContext('success response').toBeDefined();
    const resp200 = operation.allResponses.find(r => r.statusCode === '200');
    expect(resp200).toBe(success);
    if (resp200) {
      expect(resp200.content[0].type).toBe('Array<string>');
    }
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
      const _any = operation.requestBody.content.find(c => c.mediaType === '*/*');
      expect(_any).withContext('*/* request').toBeDefined();
      if (_any) {
        expect(_any.type).toBe('Blob');
      }
    }
    expect(operation.allResponses.length).toBe(4);
    const success = operation.successResponse;
    expect(success).withContext('success response').toBeDefined();
    if (success) {
      expect(success.statusCode).toBe('200');
      expect(success.content.length).toBe(2);
      const plain = success.content.find(c => c.mediaType === 'text/plain');
      expect(plain).withContext('plain response').toBeDefined();
      if (plain) {
        expect(plain.type).toBe('string');
      }
      const _any = success.content.find(c => c.mediaType === 'image/*');
      expect(_any).withContext('image response').toBeDefined();
      if (_any) {
        expect(_any.type).toBe('Blob');
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

    // Assert each variant
    const vars = operation.variants;
    expect(vars.length).toBe(6); // 3 request bodies x 2 success responses

    expect(vars[0].methodName).toBe('path4Put$Json$Plain');
    expect((vars[0].requestBody as Content).mediaType).toBe('application/json');
    expect((vars[0].requestBody as Content).type).toBe('RefObject');
    expect((vars[0].successResponse as Content).mediaType).toBe('text/plain');
    expect((vars[0].successResponse as Content).type).toBe('string');

    expect(vars[1].methodName).toBe('path4Put$Json$Image');
    expect((vars[1].requestBody as Content).mediaType).toBe('application/json');
    expect((vars[1].requestBody as Content).type).toBe('RefObject');
    expect((vars[1].successResponse as Content).mediaType).toBe('image/*');
    expect((vars[1].successResponse as Content).type).toBe('Blob');

    expect(vars[2].methodName).toBe('path4Put$Plain$Plain');
    expect((vars[2].requestBody as Content).mediaType).toBe('text/plain');
    expect((vars[2].requestBody as Content).type).toBe('string');
    expect((vars[2].successResponse as Content).mediaType).toBe('text/plain');
    expect((vars[2].successResponse as Content).type).toBe('string');

    expect(vars[3].methodName).toBe('path4Put$Plain$Image');
    expect((vars[3].requestBody as Content).mediaType).toBe('text/plain');
    expect((vars[3].requestBody as Content).type).toBe('string');
    expect((vars[3].successResponse as Content).mediaType).toBe('image/*');
    expect((vars[3].successResponse as Content).type).toBe('Blob');

    expect(vars[4].methodName).toBe('path4Put$Any$Plain');
    expect((vars[4].requestBody as Content).mediaType).toBe('*/*');
    expect((vars[4].requestBody as Content).type).toBe('Blob');
    expect((vars[4].successResponse as Content).mediaType).toBe('text/plain');
    expect((vars[4].successResponse as Content).type).toBe('string');

    expect(vars[5].methodName).toBe('path4Put$Any$Image');
    expect((vars[5].requestBody as Content).mediaType).toBe('*/*');
    expect((vars[5].requestBody as Content).type).toBe('Blob');
    expect((vars[5].successResponse as Content).mediaType).toBe('image/*');
    expect((vars[5].successResponse as Content).type).toBe('Blob');

  });

  it('GET /path5', () => {
    const operation = gen.operations.get('path5Get');
    expect(operation).toBeDefined();
    if (!operation) return;
    expect(operation.path).toBe('/path5');
    expect(operation.method).toBe('get');
    expect(operation.allResponses.length).toBe(1);
    const success = operation.successResponse;
    if (success) {
      const json = success.content.find(c => c.mediaType === 'application/json');
      expect(json).toBeDefined();
      const resp200 = operation.allResponses.find(r => r.statusCode === '200');
      expect(resp200).toBe(success);
    }
  });

  it('GET /path6', () => {
    const optionsWithCustomizedResponseType = { ...options } as Options;
    optionsWithCustomizedResponseType.customizedResponseType = {
      '/path6': {
        toUse: 'arraybuffer'
      }
    };
    gen = new NgOpenApiGen(allOperationsSpec as OpenAPIObject, optionsWithCustomizedResponseType);
    gen.generate();
    const operation = gen.operations.get('path6Get');
    expect(operation).toBeDefined();
    expect(operation?.variants[0].responseType).toBe('arraybuffer');
  });
});
