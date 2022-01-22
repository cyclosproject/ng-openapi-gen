import { SchemaObject, OpenAPIObject } from 'openapi3-ts';
import { EnumValue } from './enum-value';
import { GenType } from './gen-type';
import { tsComments, tsType, unqualifiedName } from './gen-utils';
import { Options } from './options';
import { Property } from './property';

/**
 * Context to generate a model
 */
export class Model extends GenType {
  // General type
  isSimple: boolean;
  isEnum: boolean;
  isObject: boolean;

  // Simple properties
  simpleType: string;
  enumValues: EnumValue[];

  // Array properties
  elementType: string;

  // Object properties
  properties: Property[];
  additionalPropertiesType: string;

  // Additional properties
  readOnly: boolean;

  constructor(
    public openApi: OpenAPIObject,
    name: string,
    public schema: SchemaObject,
    options: Options
  ) {
    super(name, unqualifiedName, options);

    const description = schema.description || '';
    this.tsComments = tsComments(description, 0, schema.deprecated);

    const type = schema.type || 'any';

    // When enumStyle is 'alias' it is handled as a simple type.
    if (
      options.enumStyle !== 'alias' &&
      (schema.enum || []).length > 0 &&
      ['string', 'number', 'integer'].includes(type)
    ) {
      const names = (schema['x-enumNames'] as string[]) || [];
      const values = schema.enum || [];
      this.enumValues = [];
      for (let i = 0; i < values.length; i++) {
        const enumValue = new EnumValue(type, names[i], values[i], options);
        this.enumValues.push(enumValue);
      }
    }

    this.isObject =
      (type === 'object' || !!schema.properties) && !schema.nullable;
    this.isEnum = (this.enumValues || []).length > 0;
    this.isSimple = !this.isObject && !this.isEnum;

    this.readOnly = schema.readOnly || false;

    if (this.isObject) {
      // Object
      const propertiesByName = new Map<string, Property>();
      this.collectObject(schema, propertiesByName);
      const sortedNames = [...propertiesByName.keys()];
      sortedNames.sort();
      this.properties = sortedNames.map(
        (propName) => propertiesByName.get(propName) as Property
      );
    } else {
      // Simple / array / enum / union / intersection
      this.simpleType = tsType(schema, options, openApi);
    }
    this.collectImports(schema);
    this.updateImports();
  }

  protected pathToModels(): string {
    if (this.namespace) {
      const depth = this.namespace.split('/').length;
      let path = '';
      for (let i = 0; i < depth; i++) {
        path += '../';
      }
      return path;
    }
    return './';
  }

  protected skipImport(name: string): boolean {
    // Don't import own type
    return this.name === name;
  }

  private collectObject(
    schema: SchemaObject,
    propertiesByName: Map<string, Property>
  ) {
    if (schema.type === 'object' || !!schema.properties) {
      // An object definition
      const properties = schema.properties || {};
      const required = schema.required || [];
      const readOnly = schema.readOnly || false;
      const propNames = Object.keys(properties);
      // When there are additional properties, we need an union of all types for it.
      // See https://github.com/cyclosproject/ng-openapi-gen/issues/68
      const propTypes = new Set<string>();
      const appendType = (type: string) => {
        if (type.startsWith('null | ')) {
          propTypes.add('null');
          propTypes.add(type.substr('null | '.length));
        } else {
          propTypes.add(type);
        }
      };
      for (const propName of propNames) {
        const prop = new Property(
          this,
          propName,
          properties[propName],
          required.includes(propName),
          this.options,
          this.openApi
        );
        propertiesByName.set(propName, prop);
        appendType(prop.type);
        if (!prop.required) {
          propTypes.add('undefined');
        }
      }
      if (schema.additionalProperties === true) {
        this.additionalPropertiesType = 'any';
      } else if (schema.additionalProperties) {
        const propType = tsType(
          schema.additionalProperties,
          this.options,
          this.openApi
        );
        appendType(propType);
        this.additionalPropertiesType = [...propTypes].sort().join(' | ');
      }

      // Aditional properties
      this.readOnly = readOnly;
    }
    if (schema.allOf) {
      schema.allOf.forEach((s) => this.collectObject(s, propertiesByName));
    }
  }
}
