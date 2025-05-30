import { OpenAPIObject } from '@loopback/openapi-v3-types';
import { ClassDeclaration, TypescriptParser } from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { Options } from '../lib/options';
import options from './skipJsonSuffix.config.json';
import skipJsonSuffixSpec from './skipJsonSuffix.json';

const gen = new NgOpenApiGen(skipJsonSuffixSpec as OpenAPIObject, options as Options);
gen.generate();


describe('Generation tests using skipJsonSuffix.config', () => {

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
        function assertMethodExists(name: string) {
          const method = cls.methods.find(m => m.name === name);
          expect(method).withContext(`method ${name}`).toBeDefined();
        } function assertMethodNotExists(name: string) {
          const method = cls.methods.find(m => m.name === name);
          expect(method).withContext(`method ${name}`).toBeUndefined();
        }
        assertMethodExists('fooGet$Response');
        assertMethodExists('fooGet'); // Json
        assertMethodExists('fooGet$Plain');
        assertMethodNotExists('fooGet$Json');
        assertMethodExists('barGet$Response');
        assertMethodExists('barGet');
        assertMethodNotExists('barGet$Plain');

        done();
      });
    }
  });

});
