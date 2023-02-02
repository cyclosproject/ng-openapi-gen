import { OpenAPIObject } from 'openapi3-ts';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import options from './enums.config.json';
import enumsSpec from './enums.json';
import * as fs from 'fs';
import { Options } from '../lib/options';

describe('Test enum generation', () => {

  it('default enum style', () => {
    const genDefault = new NgOpenApiGen(enumsSpec as OpenAPIObject, {
      ...options,
      output: 'out/enumStyle/default/'
    } as Options);
    genDefault.generate();
    const fileContents = fs.readFileSync(fs.realpathSync(`${genDefault.outDir}/models/flavor-enum.ts`));
    expect(/Vanilla = 'vanilla'/.test(fileContents.toString())).toBeTrue();
    expect(/StrawBerry = 'StrawBerry'/.test(fileContents.toString())).toBeTrue();
    expect(/CookieDough = 'cookie dough'/.test(fileContents.toString())).toBeTrue();
    expect(/ChocolateChip = 'Chocolate Chip'/.test(fileContents.toString())).toBeTrue();
    expect(/ButterPecan = 'butter_pecan'/.test(fileContents.toString())).toBeTrue();
    expect(/CokeLight = 'COKE light'/.test(fileContents.toString())).toBeTrue();
  });

  it('enum style "alias"', () => {
    const genAlias = new NgOpenApiGen(enumsSpec as OpenAPIObject, {
      ...options,
      output: 'out/enumStyle/alias/',
      enumStyle: 'alias'
    } as Options);
    genAlias.generate();
    const fileContents = fs.readFileSync(fs.realpathSync(`${genAlias.outDir}/models/flavor-enum.ts`));
    expect(/export type FlavorEnum = 'vanilla' | 'StrawBerry' | 'cookie dough' | 'Chocolate Chip' | 'butter_pecan' | 'COKE light';/.test(fileContents.toString())).toBeTrue();
  });

  it('enum style "upper"', () => {
    const genUpper = new NgOpenApiGen(enumsSpec as OpenAPIObject, {
      ...options,
      output: 'out/enumStyle/upper/',
      enumStyle: 'upper'
    } as Options);
    genUpper.generate();
    const fileContents = fs.readFileSync(fs.realpathSync(`${genUpper.outDir}/models/flavor-enum.ts`));
    expect(/VANILLA = 'vanilla'/.test(fileContents.toString())).toBeTrue();
    expect(/STRAW_BERRY = 'StrawBerry'/.test(fileContents.toString())).toBeTrue();
    expect(/COOKIE_DOUGH = 'cookie dough'/.test(fileContents.toString())).toBeTrue();
    expect(/CHOCOLATE_CHIP = 'Chocolate Chip'/.test(fileContents.toString())).toBeTrue();
    expect(/BUTTER_PECAN = 'butter_pecan'/.test(fileContents.toString())).toBeTrue();
    expect(/COKE_LIGHT = 'COKE light'/.test(fileContents.toString())).toBeTrue();
  });

  it('enum style "pascal"', () => {
    const genPascal = new NgOpenApiGen(enumsSpec as OpenAPIObject, {
      ...options,
      output: 'out/enumStyle/pascal/',
      enumStyle: 'pascal'
    } as Options);
    genPascal.generate();
    const fileContents = fs.readFileSync(fs.realpathSync(`${genPascal.outDir}/models/flavor-enum.ts`));
    expect(/Vanilla = 'vanilla'/.test(fileContents.toString())).toBeTrue();
    expect(/StrawBerry = 'StrawBerry'/.test(fileContents.toString())).toBeTrue();
    expect(/CookieDough = 'cookie dough'/.test(fileContents.toString())).toBeTrue();
    expect(/ChocolateChip = 'Chocolate Chip'/.test(fileContents.toString())).toBeTrue();
    expect(/ButterPecan = 'butter_pecan'/.test(fileContents.toString())).toBeTrue();
    expect(/CokeLight = 'COKE light'/.test(fileContents.toString())).toBeTrue();
  });

  it('enum style "ignorecase"', () => {
    const genIgnorecase = new NgOpenApiGen(enumsSpec as OpenAPIObject, {
      ...options,
      output: 'out/enumStyle/ignorecase/',
      enumStyle: 'ignorecase'
    } as Options);
    genIgnorecase.generate();
    const fileContents = fs.readFileSync(fs.realpathSync(`${genIgnorecase.outDir}/models/flavor-enum.ts`));
    expect(/vanilla = 'vanilla'/.test(fileContents.toString())).toBeTrue();
    expect(/StrawBerry = 'StrawBerry'/.test(fileContents.toString())).toBeTrue();
    expect(/cookie_dough = 'cookie dough'/.test(fileContents.toString())).toBeTrue();
    expect(/Chocolate_Chip = 'Chocolate Chip'/.test(fileContents.toString())).toBeTrue();
    expect(/butter_pecan = 'butter_pecan'/.test(fileContents.toString())).toBeTrue();
    expect(/COKE_light = 'COKE light'/.test(fileContents.toString())).toBeTrue();
  });

});
