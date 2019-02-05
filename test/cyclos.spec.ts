import { OpenAPIObject } from 'openapi3-ts';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import options from './cyclos.config.json';
import allOperationsSpec from './cyclos.json';

const gen = new NgOpenApiGen(allOperationsSpec as OpenAPIObject, options);
gen.generate();

describe('Generation tests using cyclos.json', () => {
});
