import { SchemaObject } from 'openapi3-ts';
import { EnumValue } from './enum-value';
import { GenType } from './gen-type';
import { fileName, modelClass, simpleName, tsComments, tsType } from './gen-utils';
import { Options } from './options';
import { Property } from './property';

/**
 * Context to generate a model
 */
export class Model extends GenType {

  // General type
  isSimple: boolean;
  isEnum: boolean; // only true for strings. Numbers can have enumerated values, but they don't generate an enum
  isArray: boolean;
  isObject: boolean;

  // Simple properties
  simpleType: string;

  // Enum properties
  enumValues: EnumValue[];

  // Array properties
  elementType: string;

  // Object properties
  hasSuperClasses: boolean;
  superClasses: string[];
  properties: Property[];
  additionalProperties: string;

  constructor(name: string, public schema: SchemaObject, options: Options) {
    super(name, options);

    this.typeName = modelClass(name, options);
    this.fileName = fileName(this.typeName);

    const description = schema.description || '';
    this.tsComments = tsComments(description, 0);

    const type = schema.type || 'any';
    this.isArray = type === 'array';
    this.isObject = type === 'object' || (schema.allOf || []).length > 0;
    this.isEnum = type === 'string' && (schema.enum || []).length > 0;
    this.isSimple = !this.isEnum && !this.isArray && !this.isObject;

    if (this.isEnum) {
      // Enum of string values
      this.enumValues = (schema.enum || []).map(value => new EnumValue(value));
      this.enumValues[this.enumValues.length - 1].last = true;
    } else if (this.isArray) {
      // Array
      this.elementType = tsType(schema.items, options);
    } else if (this.isObject) {
      // Object
      this.superClasses = [];
      const propertiesByName = new Map<string, Property>();
      this.collectObject(schema, propertiesByName);
      const sortedNames = [...propertiesByName.keys()];
      sortedNames.sort();
      this.properties = sortedNames.map(propName => propertiesByName.get(propName) as Property);
    } else {
      // Simple / union
      this.simpleType = tsType(schema, options);
    }
    this.collectImports(schema);
    this.updateImports();
  }

  protected pathToModels(): string {
    return './';
  }

  private collectObject(schema: SchemaObject, propertiesByName: Map<string, Property>) {
    const allOf = schema.allOf;
    if (allOf) {
      for (const part of allOf) {
        if (part.$ref) {
          // A superclass
          this.superClasses.push(simpleName(part.$ref));
        } else {
          this.collectObject(part, propertiesByName);
        }
      }
    } else if (schema.type === 'object') {
      // An object definition
      const properties = schema.properties || {};
      const required = schema.required || [];
      const propNames = Object.keys(properties);
      for (const propName of propNames) {
        propertiesByName.set(propName, new Property(propName, properties[propName], required.includes(propName), this.options));
      }
      if (schema.additionalProperties === true) {
        this.additionalProperties = 'any';
      } else if (schema.additionalProperties) {
        this.additionalProperties = tsType(schema.additionalProperties, this.options);
      }
    }
  }
}