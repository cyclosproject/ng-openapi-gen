import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import options from './removeStaleFiles.config.json';
import fullSpec from './removeStaleFiles.json';
import * as fs from 'fs';
import { Options } from '../lib/options';
import { OpenAPIObject } from '../lib/openapi-typings';

const spec = fullSpec as unknown as OpenAPIObject;

// A clone of the spec with the "store"-tagged path (and its only reference
// to the "Nested.Thing" model) removed, simulating the API shrinking on a
// subsequent regeneration.
function reducedSpec(): OpenAPIObject {
  const clone = JSON.parse(JSON.stringify(spec)) as OpenAPIObject;
  delete clone.paths['/second-path'];
  return clone;
}

describe('Stale file and directory removal', () => {

  it('removes stale files and directories by default', () => {
    const out = 'out/removeStaleFiles/default';

    const gen = new NgOpenApiGen(spec, { ...options, output: out } as Options);
    gen.generate();

    expect(fs.existsSync(`${gen.outDir}/fn/pet/first-path.ts`)).toBe(true);
    expect(fs.existsSync(`${gen.outDir}/fn/store/second-path.ts`)).toBe(true);
    expect(fs.existsSync(`${gen.outDir}/models/Nested/thing.ts`)).toBe(true);

    const gen2 = new NgOpenApiGen(reducedSpec(), { ...options, output: out } as Options);
    gen2.generate();

    expect(fs.existsSync(`${gen2.outDir}/fn/pet/first-path.ts`)).toBe(true);
    expect(fs.existsSync(`${gen2.outDir}/fn/store/second-path.ts`)).toBe(false);
    expect(fs.existsSync(`${gen2.outDir}/fn/store`)).toBe(false);
    expect(fs.existsSync(`${gen2.outDir}/models/Nested`)).toBe(false);
  });

  it('keeps stale files and directories when removeStaleFiles is false', () => {
    const out = 'out/removeStaleFiles/keep';

    const gen = new NgOpenApiGen(spec, { ...options, output: out, removeStaleFiles: false } as Options);
    gen.generate();

    const gen2 = new NgOpenApiGen(reducedSpec(), { ...options, output: out, removeStaleFiles: false } as Options);
    gen2.generate();

    expect(fs.existsSync(`${gen2.outDir}/fn/pet/first-path.ts`)).toBe(true);
    expect(fs.existsSync(`${gen2.outDir}/fn/store/second-path.ts`)).toBe(true);
    expect(fs.existsSync(`${gen2.outDir}/models/Nested/thing.ts`)).toBe(true);
  });

});
