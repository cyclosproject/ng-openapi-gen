import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { OpenAPIObject } from '../lib/openapi-typings';
import options from './model-name-collision.config.json';
import modelNameCollisionSpec from './model-name-collision.json';

const spec = modelNameCollisionSpec as OpenAPIObject;

describe('Model Name Collision Tests', () => {
  let gen: NgOpenApiGen;

  beforeAll(() => {
    gen = new NgOpenApiGen(spec, options);
    gen.generate();
  });

  it('should handle model name collision with imports', () => {
    // Check that both models exist
    const clazz = gen.models.get('Clazz');
    const fooBarBazClazz = gen.models.get('Foo.Bar.Baz.Clazz');

    expect(clazz).toBeDefined();
    expect(fooBarBazClazz).toBeDefined();

    if (fooBarBazClazz) {
      const ts = gen.templates.apply('model', fooBarBazClazz);

      // The generated code should use import aliases to avoid naming collisions
      // Should import base class with an alias: import { Clazz as Clazz_1 } from '../../../../models/clazz';
      expect(ts).toContain('import { Clazz as Clazz_1 } from');
      expect(ts).toContain('\'../../../../models/clazz\'');

      // Should export the current model with its correct name
      expect(ts).toContain('export type Clazz =');

      // Should use the aliased import for the base type
      expect(ts).toContain('export type Clazz = Clazz_1 &');

      // Should use the current model name for self-references
      expect(ts).toContain('\'refProperty\'?: Clazz;');
      expect(ts).toContain('\'arrayProperty\': Array<Clazz>;');

      // Should use the aliased import (Clazz_1) for parent class references
      expect(ts).toContain('\'parentRefProperty\'?: Clazz_1;');
      expect(ts).toContain('\'parentArrayProperty\'?: Array<Clazz_1>;');

      // Should use aliased import in nested object properties
      expect(ts).toContain('\'nestedParentRef\': Clazz_1;');
      expect(ts).toContain('\'nestedParentArray\'?: Array<Clazz_1>;');

      // Should still use current model name for self-references in nested objects
      expect(ts).toContain('\'nestedArray\': Array<Clazz>;');
      expect(ts).toContain('\'nestedRef\': Clazz;');

      // The generated code should be syntactically valid
      expect(ts).toBeTruthy();
    }
  });
});
