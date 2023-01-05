import { OpenAPIObject } from 'openapi3-ts';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import options from './templates.config.json';
import templatesSpec from './templates.json';
import * as fs from 'fs';
import { Options } from '../lib/options';

const gen = new NgOpenApiGen(templatesSpec as OpenAPIObject, options as Options);
const genCr = new NgOpenApiGen(templatesSpec as OpenAPIObject, { ...options, endOfLineStyle: 'cr' } as Options);
const genLf = new NgOpenApiGen(templatesSpec as OpenAPIObject, { ...options, endOfLineStyle: 'lf' } as Options);
const genCrlf = new NgOpenApiGen(templatesSpec as OpenAPIObject, { ...options, endOfLineStyle: 'crlf' } as Options);

gen.generate();

describe('Generation tests using templates.json', () => {

  it('Service template applied with custom Handlebars helper', () => {
    genCr.generate();
    const fileContents = fs.readFileSync(fs.realpathSync(`${gen.outDir}/services/tag-1.service.ts`));
    expect(/(Description of tag1)/ug.test(fileContents.toString())).toBeTrue();
  });

  it('Normalize end of line to cr', () => {
    genCr.generate();
    const fileContents = fs.readFileSync(fs.realpathSync(`${genCr.outDir}/services/tag-1.service.ts`));
    expect(/[\r]/.test(fileContents.toString())).toBeTrue();
    expect(/[\n]/.test(fileContents.toString())).toBeFalse();
  });

  it('Normalize end of line to lf', () => {
    genLf.generate();
    const fileContents = fs.readFileSync(fs.realpathSync(`${genLf.outDir}/services/tag-1.service.ts`));
    expect(/[\r]/.test(fileContents.toString())).toBeFalse();
    expect(/[\n]/.test(fileContents.toString())).toBeTrue();
  });

  it('Normalize end of line to crlf', () => {
    genCrlf.generate();
    const fileContents = fs.readFileSync(fs.realpathSync(`${genCrlf.outDir}/services/tag-1.service.ts`));
    expect(/[\r]/.test(fileContents.toString())).toBeTrue();
    expect(/[\n]/.test(fileContents.toString())).toBeTrue();
  });
});
