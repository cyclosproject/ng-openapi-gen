import * as fs from 'fs-extra';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { OpenAPIObject } from '../lib/openapi-typings';
import { Options } from '../lib/options';
import options from './duplicate-x-operation-name.config.json';
import spec from './duplicate-x-operation-name.json';

const gen = new NgOpenApiGen(spec as OpenAPIObject, options as Options);
gen.generate();

describe('Generation tests using duplicate-x-operation-name.json', () => {
  it('index.ts should have both functions and parameters', () => {
    // Read file options.output + '/index.ts'
    const content = fs.readFileSync(options.output + '/index.ts', 'utf8');
    expect(content).toContain('export { getConsumption as getConsumptionCar }');
    expect(content).toContain('export type { GetConsumption$Params as GetConsumptionCar$Params }');
    expect(content).toContain('export { getConsumption as getConsumptionPlane }');
    expect(content).toContain('export type { GetConsumption$Params as GetConsumptionPlane$Params }');
  });

  it('functions.ts should have both functions and parameters', () => {
    // Read file options.output + '/functions.ts'
    const content = fs.readFileSync(options.output + '/functions.ts', 'utf8');
    expect(content).toContain('export { getConsumption as getConsumptionCar }');
    expect(content).toContain('export type { GetConsumption$Params as GetConsumptionCar$Params }');
    expect(content).toContain('export { getConsumption as getConsumptionPlane }');
    expect(content).toContain('export type { GetConsumption$Params as GetConsumptionPlane$Params }');
  });

});
