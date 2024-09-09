import { upperFirst } from 'lodash';
import { OpenAPIObject } from 'openapi3-ts';
import { ClassDeclaration, FunctionDeclaration, InterfaceDeclaration, TypescriptParser } from 'typescript-parser';
import { Content } from '../lib/content';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { Options } from '../lib/options';
import options from './all-operations.config.json';
import allOperationsSpec from './all-operations.json';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 1000;

function paramsName(name: string) {
  if (name.endsWith('$Response')) {
    name = name.substring(0, name.length - '$Response'.length);
  }
  return `${upperFirst(name)}$Params`;
}

describe('Generation tests using all-operations.json', () => {
  let gen: NgOpenApiGen;

  beforeEach(() => {
    gen = new NgOpenApiGen(allOperationsSpec as OpenAPIObject, options as any);
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
          expect(method.parameters.length).toBe(2);
          const type = method.parameters[0].type;
          expect(type).toEqual(paramsName(name));
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
          expect(method.parameters.length).toBe(2);
          const type = method.parameters[0].type;
          expect(type).toEqual(paramsName(name));
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
      function assertPath1Post(name: string) {
        const method = cls.methods.find(m => m.name === name);
        expect(method).withContext(`method ${name}`).toBeDefined();
        if (method) {
          expect(method.parameters.length).toBe(2);
          const type = method.parameters[0].type;
          expect(type).toEqual(paramsName(name));
        }
      }
      assertPath1Post('path1Post$Json$Response');
      assertPath1Post('path1Post$Json');
      assertPath1Post('path1Post$Plain$Response');
      assertPath1Post('path1Post$Plain');

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
    expect(noTag.operations.length).toBe(7);

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
          expect(method.parameters.length).toBe(2);
          const type = method.parameters[0].type;
          expect(type).toEqual(paramsName(name));
        }
      }
      assertPath3Del('path3Del$Response');
      assertPath3Del('path3Del');

      function assertPath4Put(name: string) {
        const method = cls.methods.find(m => m.name === name);
        expect(method).withContext(`method ${name}`).toBeDefined();
        if (method) {
          expect(method.parameters.length).toBe(2);
          const type = method.parameters[0].type;
          expect(type).toEqual(paramsName(name));
        }
      }
      assertPath4Put('path4Put$Json$Plain$Response');
      assertPath4Put('path4Put$Json$Plain');
      assertPath4Put('path4Put$Plain$Plain$Response');
      assertPath4Put('path4Put$Plain$Plain');
      assertPath4Put('path4Put$Any$Plain$Response');
      assertPath4Put('path4Put$Any$Plain');

      assertPath4Put('path4Put$Json$Image$Response');
      assertPath4Put('path4Put$Json$Image');
      assertPath4Put('path4Put$Plain$Image$Response');
      assertPath4Put('path4Put$Plain$Image');
      assertPath4Put('path4Put$Any$Image$Response');
      assertPath4Put('path4Put$Any$Image');

      const withQuotes = cls.methods.find(m => m.name === 'withQuotes');
      expect(withQuotes).withContext('method withQuotes').toBeDefined();

      done();
    });
  });

  it('NoTag-path-3-del-fn', done => {
    const noTag = gen.services.get('noTag');
    const path3Del = noTag?.operations?.find(op => op.id === 'path3Del');
    expect(path3Del).toBeDefined();
    if (!path3Del) return;
    const ts = gen.templates.apply('fn', path3Del.variants[0]);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(ast => {
      expect(ast.declarations.length).toBe(2);
      expect(ast.declarations[0]).toEqual(jasmine.any(InterfaceDeclaration));
      const params = ast.declarations[0] as InterfaceDeclaration;
      expect(params?.name).toEqual('Path3Del$Params');

      expect(ast.declarations[1]).toEqual(jasmine.any(FunctionDeclaration));
      const fn = ast.declarations[1] as FunctionDeclaration;
      expect(fn?.name).toEqual('path3Del');
      expect(fn?.parameters?.length).toEqual(4);
      expect(fn?.parameters?.[0]?.name).toEqual('http');
      expect(fn?.parameters?.[0]?.type).toEqual('HttpClient');
      expect(fn?.parameters?.[1]?.name).toEqual('rootUrl');
      expect(fn?.parameters?.[1]?.type).toEqual('string');
      expect(fn?.parameters?.[2]?.name).toEqual('params');
      expect(fn?.parameters?.[2]?.type).toEqual('Path3Del$Params');
      expect(fn?.parameters?.[3]?.name).toEqual('context');
      expect(fn?.parameters?.[3]?.type).toEqual('HttpContext');

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
    expect(params[0].name).toBe('common2');
    expect(params[0].in).toBe('header');
    expect(params[0].type).toBe('RefObject');
    expect(params[1].name).toBe('common1');
    expect(params[1].type).toBe('RefString');
    expect(params[1].in).toBe('query');
    expect(params[2].name).toBe('get1');
    expect(params[2].type).toBe('RefString');
    expect(params[2].in).toBe('query');
    expect(params[3].name).toBe('get2');
    expect(params[3].type).toBe('number | null');
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
      expect(success.content.length).toBe(3);
      const plain = success.content.find(c => c.mediaType === 'text/plain');
      expect(plain).withContext('plain response').toBeDefined();
      if (plain) {
        expect(plain.type).toBe('string');
      }
      const binary = success.content.find(c => c.mediaType === 'text/binary');
      expect(binary).withContext('binary response').toBeDefined();
      if (binary) {
        expect(binary.type).toBe('Blob');
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
    expect(vars.length).toBe(9); // 3 request bodies x 3 success responses

    const jsonPlain = vars[0];
    expect(jsonPlain.methodName).toBe('path4Put$Json$Plain');
    expect((jsonPlain.requestBody as Content).mediaType).toBe('application/json');
    expect((jsonPlain.requestBody as Content).type).toBe('RefObject');
    expect((jsonPlain.successResponse as Content).mediaType).toBe('text/plain');
    expect((jsonPlain.successResponse as Content).type).toBe('string');

    const jsonBinary = vars[1];
    expect(jsonBinary.methodName).toBe('path4Put$Json$Binary');
    expect((jsonBinary.requestBody as Content).mediaType).toBe('application/json');
    expect((jsonBinary.requestBody as Content).type).toBe('RefObject');
    expect((jsonBinary.successResponse as Content).mediaType).toBe('text/binary');
    expect((jsonBinary.successResponse as Content).type).toBe('Blob');

    const jsonImage = vars[2];
    expect(jsonImage.methodName).toBe('path4Put$Json$Image');
    expect((jsonImage.requestBody as Content).mediaType).toBe('application/json');
    expect((jsonImage.requestBody as Content).type).toBe('RefObject');
    expect((jsonImage.successResponse as Content).mediaType).toBe('image/*');
    expect((jsonImage.successResponse as Content).type).toBe('Blob');

    const plainPlain = vars[3];
    expect(plainPlain.methodName).toBe('path4Put$Plain$Plain');
    expect((plainPlain.requestBody as Content).mediaType).toBe('text/plain');
    expect((plainPlain.requestBody as Content).type).toBe('string');
    expect((plainPlain.successResponse as Content).mediaType).toBe('text/plain');
    expect((plainPlain.successResponse as Content).type).toBe('string');

    const plainBinary = vars[4];
    expect(plainBinary.methodName).toBe('path4Put$Plain$Binary');
    expect((plainBinary.requestBody as Content).mediaType).toBe('text/plain');
    expect((plainBinary.requestBody as Content).type).toBe('string');
    expect((plainBinary.successResponse as Content).mediaType).toBe('text/binary');
    expect((plainBinary.successResponse as Content).type).toBe('Blob');

    const plainImage = vars[5];
    expect(plainImage.methodName).toBe('path4Put$Plain$Image');
    expect((plainImage.requestBody as Content).mediaType).toBe('text/plain');
    expect((plainImage.requestBody as Content).type).toBe('string');
    expect((plainImage.successResponse as Content).mediaType).toBe('image/*');
    expect((plainImage.successResponse as Content).type).toBe('Blob');

    const anyPlain = vars[6];
    expect(anyPlain.methodName).toBe('path4Put$Any$Plain');
    expect((anyPlain.requestBody as Content).mediaType).toBe('*/*');
    expect((anyPlain.requestBody as Content).type).toBe('Blob');
    expect((anyPlain.successResponse as Content).mediaType).toBe('text/plain');
    expect((anyPlain.successResponse as Content).type).toBe('string');

    const anyBinary = vars[7];
    expect(anyBinary.methodName).toBe('path4Put$Any$Binary');
    expect((anyBinary.requestBody as Content).mediaType).toBe('*/*');
    expect((anyBinary.requestBody as Content).type).toBe('Blob');
    expect((anyBinary.successResponse as Content).mediaType).toBe('text/binary');
    expect((anyBinary.successResponse as Content).type).toBe('Blob');

    const anyImage = vars[8];
    expect(anyImage.methodName).toBe('path4Put$Any$Image');
    expect((anyImage.requestBody as Content).mediaType).toBe('*/*');
    expect((anyImage.requestBody as Content).type).toBe('Blob');
    expect((anyImage.successResponse as Content).mediaType).toBe('image/*');
    expect((anyImage.successResponse as Content).type).toBe('Blob');
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
      const json = success.content.find(c => c.mediaType === 'application/vnd.my-custom-type+json;version=2');
      expect(json).toBeDefined();
      const resp200 = operation.allResponses.find(r => r.statusCode === '200');
      expect(resp200).toBe(success);
    }
  });

  it('GET /path6', () => {
    const optionsWithCustomizedResponseType = { ...options } as Options;
    optionsWithCustomizedResponseType.customizedResponseType = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
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


  it('DELETE /path7', () => {
    const operation = gen.operations.get('delete');
    expect(operation).toBeDefined();
    if (!operation) return;
    expect(operation.path).toBe('/path7');
    expect(operation.method).toBe('delete');
    expect(operation.allResponses.length).toBe(1);
    const success = operation.successResponse;
    expect(success?.statusCode).toEqual('204');
  });


  it('GET /path8', () => {
    const optionsWithCustomizedResponseType = { ...options } as Options;
    gen = new NgOpenApiGen(allOperationsSpec as OpenAPIObject, optionsWithCustomizedResponseType);
    gen.generate();
    const operation = gen.operations.get('path8Get');
    expect(operation).toBeDefined();

    if (!operation) return;

    // Assert each variant
    const vars = operation.variants;
    expect(vars.length).toBe(4);

    const jsonPlain = vars[0];
    expect(jsonPlain.responseType).toBe('json');
    expect(jsonPlain.methodName).toBe('path8Get$Json');

    const halJsonPlain = vars[1];
    expect(halJsonPlain.responseType).toBe('json');
    expect(halJsonPlain.methodName).toBe('path8Get$HalJson');

    const compactJsonPlain = vars[2];
    expect(compactJsonPlain.responseType).toBe('json');
    expect(compactJsonPlain.methodName).toBe('path8Get$ApplicationXSpringDataCompactJson');

    const text = vars[3];
    expect(text.responseType).toBe('text');
    expect(text.methodName).toBe('path8Get$UriList');
  });


  it('POST /path8', () => {
    const optionsWithCustomizedResponseType = { ...options } as Options;
    gen = new NgOpenApiGen(allOperationsSpec as OpenAPIObject, optionsWithCustomizedResponseType);
    gen.generate();
    const operation = gen.operations.get('path8Post');
    expect(operation).toBeDefined();
    expect(operation?.variants[0].responseType).toBe('json');

    if (!operation) return;

    // Assert each variant
    const vars = operation.variants;
    expect(vars.length).toBe(1);

    const jsonPlain = vars[0];
    expect(jsonPlain.methodName).toBe('path8Post');
  });
});
