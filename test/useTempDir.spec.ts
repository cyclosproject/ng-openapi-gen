import { OpenAPIObject } from 'openapi3-ts';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import options from './useTempDir.config.json';
import templatesSpec from './useTempDir.json';
import os from 'os';

describe('Generation tests using system temporary directory', () => {

  it('Use system temp folder when useTempDir is true', () => {

    const gen = new NgOpenApiGen(templatesSpec as OpenAPIObject, options);
    gen.generate();

    const tempDirectory = os.tmpdir();

    expect(gen.tempDir.startsWith(tempDirectory)).toBeTrue();
    expect(gen.tempDir.endsWith('useTempDir$')).toBeTrue();

  });

});
