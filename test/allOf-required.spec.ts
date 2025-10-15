import { TypescriptParser } from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { Options } from '../lib/options';
import allOfRequired from './allOf-required.json';
import { OpenAPIObject } from '../lib/openapi-typings';
import options from './allOf-required.config.json';

const spec = allOfRequired as unknown as OpenAPIObject;
const gen = new NgOpenApiGen(spec, options as Options);
gen.generate();

describe('Generation tests using allOf-required.json', () => {
  it('generates a type with non-undefined fields from objects composed using allOf', () => {
    const ref = gen.models.get('snake-case');
    const ts = gen.templates.apply('model', ref);
    const parser = new TypescriptParser();
    parser.parseSource(ts).then(() => {
      expect.fail();
    });
  });
});
