import { OpenAPIObject } from 'openapi3-ts';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import options from './templates.config.json';
import templatesSpec from './templates.json';
import * as fs from 'fs';

const gen = new NgOpenApiGen(templatesSpec as OpenAPIObject, options);
gen.generate();

describe('Generation tests using templates.json', () => {

  it('Service template applied with custom Handlebars helper', () => {
    const fileContents = fs.readFileSync(fs.realpathSync(`${gen.outDir}/services/tag-1.service.ts`));
    expect(/(DESCRIPTION OF TAG1)/.test(fileContents.toString())).toBeTrue();
  });
});
