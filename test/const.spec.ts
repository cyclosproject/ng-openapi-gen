import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import options from './const.config.json';
import constsSpec from './const.json';
import * as fs from 'fs';
import { Options } from '../lib/options';
import { OpenAPIObject } from '../lib/openapi-typings';

const spec = constsSpec as unknown as OpenAPIObject;

describe('Test const generation', () => {

  it('const', () => {
    const genDefault = new NgOpenApiGen(spec, {
      ...options,
      output: 'out/constStyle/default/'
    } as Options);
    genDefault.generate();
    const fileContents = fs.readFileSync(fs.realpathSync(`${genDefault.outDir}/models/flavor-const.ts`));
    expect(/flavor: 'IonlyWantChocolate'/.test(fileContents.toString())).toBe(true);
  });

});
