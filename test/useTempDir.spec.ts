import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { OpenAPIObject } from '../lib/openapi-typings';
import options from './useTempDir.config.json';
import templatesSpec from './useTempDir.json';
import os from 'os';

const spec = templatesSpec as unknown as OpenAPIObject;

describe('Generation tests using system temporary directory', () => {

  it('Use system temp folder when useTempDir is true', () => {

    const gen = new NgOpenApiGen(spec, options);
    gen.generate();

    const tempDirectory = os.tmpdir();

    expect(gen.tempDir.startsWith(tempDirectory)).toBe(true);
    expect(gen.tempDir.endsWith('useTempDir$')).toBe(true);

  });

  it('Do not use system temp folder when useTempDir is false', () => {

    const optionsWithoutTempDir = { ...options };
    optionsWithoutTempDir.useTempDir = false;

    const gen = new NgOpenApiGen(spec, optionsWithoutTempDir);
    gen.generate();

    const tempDirectory = os.tmpdir();
    expect(gen.tempDir.startsWith(tempDirectory)).toBe(false);

  });

});
