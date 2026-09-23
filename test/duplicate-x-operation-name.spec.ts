import * as fs from 'fs-extra';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { OpenAPIObject } from '../lib/openapi-typings';
import { Options } from '../lib/options';
import options from './duplicate-x-operation-name.config.json';
import spec from './duplicate-x-operation-name.json';

const gen = new NgOpenApiGen(spec as OpenAPIObject, options as Options);
gen.generate();

describe('Generation tests using duplicate-x-operation-name.json', () => {
  for (const file of ['functions.ts', 'index.ts']) {
    describe(file, () => {
      const content = fs.readFileSync(`${options.output}/${file}`, 'utf8');

      it('should disambiguate operations sharing a method name by their tag', () => {
        expect(content).toContain('export { getConsumption as getConsumptionPlane }');
        expect(content).toContain('export type { GetConsumption$Params as GetConsumptionPlane$Params }');
      });

      it('should turn the tag into a valid identifier before using it as a suffix', () => {
        // The tag `Car report` must be camelized, not appended verbatim
        expect(content).toContain('export { getConsumption as getConsumptionCarReport }');
        expect(content).toContain('export type { GetConsumption$Params as GetConsumptionCarReport$Params }');
      });
    });
  }

  it('should fail generation when the method name is duplicated within a tag', () => {
    // With the same tag on both operations, the tag cannot disambiguate anymore
    const clashingSpec = JSON.parse(JSON.stringify(spec)) as OpenAPIObject;
    (clashingSpec.paths!['/api/plane/consumption'] as any).get.tags = ['Car report'];
    const clashingGen = new NgOpenApiGen(clashingSpec, { ...options, output: 'out/duplicate-x-operation-name-clash' } as Options);
    expect(() => clashingGen.generate()).toThrowError(/unique within a tag/);
  });

  it('should fail generation when operations sharing a tag share a method name', () => {
    // A shared super-category tag groups both operations into one service, which can't declare
    // the same method twice
    const clashingSpec = JSON.parse(JSON.stringify(spec)) as OpenAPIObject;
    (clashingSpec.paths!['/api/car/consumption'] as any).get.tags.push('Report');
    (clashingSpec.paths!['/api/plane/consumption'] as any).get.tags.push('Report');
    const clashingGen = new NgOpenApiGen(clashingSpec,
      { ...options, services: true, output: 'out/duplicate-x-operation-name-shared-tag' } as Options);
    expect(() => clashingGen.generate()).toThrowError(/unique among operations sharing a tag/);
  });
});
