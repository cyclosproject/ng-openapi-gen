import { ClassDeclaration, TypescriptParser } from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { Options } from '../lib/options';
import options from './skipJsonSuffix.config.json';
import skipJsonSuffixSpec from './skipJsonSuffix.json';
import { OpenAPIObject } from '../lib/openapi-typings';

const spec = skipJsonSuffixSpec as unknown as OpenAPIObject;
const gen = new NgOpenApiGen(spec, options as Options);
gen.generate();


describe('Generation tests using skipJsonSuffix.config', () => {

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
        function assertMethodExists(name: string) {
          const method = cls.methods.find(m => m.name === name);
          expect(method).toBeDefined();
        } function assertMethodNotExists(name: string) {
          const method = cls.methods.find(m => m.name === name);
          expect(method).toBeUndefined();
        }
        assertMethodExists('fooGet$Response');
        assertMethodExists('fooGet'); // Json
        assertMethodExists('fooGet$Plain');
        assertMethodNotExists('fooGet$Json');
        assertMethodExists('barGet$Response');
        assertMethodExists('barGet');
        assertMethodNotExists('barGet$Plain');


      });
    }
  });

});
