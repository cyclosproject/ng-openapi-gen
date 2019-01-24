import { OpenAPIObject } from '@loopback/openapi-v3-types';
import { ObjectType } from '../src/metadata/object-type';
import { SimpleType } from '../src/metadata/simple-type';
import { SpecMetaData } from '../src/metadata/spec-metadata';
import { Type } from '../src/metadata/type';
import { Model } from '../src/model';
import { Options } from '../src/options';

/**
 * Returns a shared model by name
 * @param spec The OpenAPI spec
 * @param name The model name
 * @param options The generation options
 */
export function getModel(spec: OpenAPIObject, name: string, options: Options) {
  const schema = ((spec.components || {}).schemas || {})[name];
  return new Model(name, schema, options);
}

////////////////////////////////////////////////////////////////////

/**
 * Does several things:
 *
 * - Creates a new `SpecMetaData` with the given `OpenAPIObject`
 * - Gets a type by name
 * - Makes sure the top-level reference to that type is valid (`#/components/schemas/<name>`)
 * - Asserts that type to be of the expected type
 * - Returns both type and `SpecMetaData`
 */
export function assertType<T extends Type>(openApi: OpenAPIObject, name: string,
  expectedType: { new(_: any): T; }): { type: T, spec: SpecMetaData } {

  const spec = new SpecMetaData(openApi);
  const type = spec.type(name);
  expect(type.name).toBe(name);
  // Make sure the reference is also mapped
  expect(spec.type(`#/components/schemas/${name}`)).toEqual(type);
  expect(type).toEqual(jasmine.any(expectedType));
  return { type: type as T, spec: spec };
}

/**
 * Gets an object property from the given object, making sure it exists, asserts its type and then returns the property type
 * @param object The object to assert
 * @param name The property name
 * @param expectedType Either:
 *
 * - The class of the property type, such as SimpleType, ObjectType, ArrayType, etc
 * - The exact type it should be
 * - The name of a simple type's type
 */
export function assertProperty<T extends Type>(object: ObjectType, name: string,
  expectedType: { new(_: any): T; } | Type | string): T {

  const property = object.property(name);
  expect(property).toBeDefined();
  if (property) {
    expect(property.name).toBe(name);
    if (typeof expectedType === 'string') {
      // Must be a simple type with a specific type name
      expect(property.type).toEqual(jasmine.any(SimpleType));
      expect(property.type.schema.type).toBe(expectedType);
    } else if (expectedType instanceof Type) {
      // Must be exactly a given type
      expect(property.type).toEqual(expectedType as T);
    } else {
      // Must be an instance of a given type class
      expect(property.type).toEqual(jasmine.any(expectedType));
    }
    return property.type as T;
  }
  throw new Error('Undefined property');
}