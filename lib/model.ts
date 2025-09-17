import { upperCase } from 'lodash';
import { EnumValue } from './enum-value';
import { GenType } from './gen-type';
import { fileName, tsComments, tsType, unqualifiedName, resolveRef } from './gen-utils';
import { OpenAPIObject, SchemaObject, getSchemaType, isNullable, isReferenceObject } from './openapi-typings';
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
  enumArrayName?: string;
  enumArrayFileName?: string;

  // Array properties
  elementType: string;

  // Object properties
  properties: Property[];
  additionalPropertiesType: string;

  constructor(public openApi: OpenAPIObject, name: string, public schema: SchemaObject, options: Options) {
    super(name, unqualifiedName, options);

    const description = schema.description || '';
    this.tsComments = tsComments(description, 0, schema.deprecated);

    const type = getSchemaType(schema);

    // Handle enums
    const typeForEnum = Array.isArray(type) ? type[0] : type;
    if ((schema.enum || []).length > 0 && typeForEnum && ['string', 'number', 'integer'].includes(typeForEnum)) {
      this.enumArrayName = upperCase(this.typeName).replace(/\s+/g, '_');
      this.enumArrayFileName = fileName(this.typeName + '-array');

      const names = (schema as any)['x-enumNames'] as string[] || [];
      const descriptions = (schema as any)['x-enumDescriptions'] as string[] || [];
      const values = schema.enum || [];
      this.enumValues = [];
      for (let i = 0; i < values.length; i++) {
        const enumValue = new EnumValue(typeForEnum, names[i], descriptions[i], values[i], options);
        this.enumValues.push(enumValue);
      }

      // When enumStyle is 'alias' it is handled as a simple type.
      this.isEnum = options.enumStyle !== 'alias';
    }

    const hasAllOf = schema.allOf && schema.allOf.length > 0;
    const hasOneOf = schema.oneOf && schema.oneOf.length > 0;
    this.isObject = (type === 'object' || !!schema.properties) && !isNullable(schema) && !hasAllOf && !hasOneOf;
    this.isSimple = !this.isObject && !this.isEnum;

    if (this.isObject) {
      // Object
      const propertiesByName = new Map<string, Property>();
      this.collectObject(schema, propertiesByName);
      const sortedNames = [...propertiesByName.keys()];
      sortedNames.sort();
      this.properties = sortedNames.map(propName => propertiesByName.get(propName) as Property);
    } else {
      // Simple / array / enum / union / intersection
      this.simpleType = tsType(schema, options, openApi, this);
    }
    this.collectImports(schema);
    this.updateImports();
  }

  protected initPathToRoot(): string {
    if (this.namespace) {
      // for each namespace level go one directory up
      // plus the "models" directory
      return this.namespace.split('/').map(() => '../').join('').concat('../');
    }
    return '../';
  }

  protected skipImport(name: string): boolean {
    // Don't import own type
    return this.name === name;
  }

  private collectObject(schema: SchemaObject, propertiesByName: Map<string, Property>) {
    if (schema.type === 'object' || !!schema.properties) {
      // An object definition
      const properties = schema.properties || {};
      const required = schema.required || [];
      const propNames = Object.keys(properties);
      // When there are additional properties, we need an union of all types for it.
      // See https://github.com/cyclosproject/ng-openapi-gen/issues/68
      const propTypes = new Set<string>();
      const appendType = (type: string) => {
        if (type.startsWith('null | ')) {
          propTypes.add('null');
          propTypes.add(type.substring('null | '.length));
        } else {
          propTypes.add(type);
        }
      };
      for (const propName of propNames) {
        const prop = new Property(this, propName, properties[propName], required.includes(propName), this.options, this.openApi);
        propertiesByName.set(propName, prop);
        appendType(prop.type);
        if (!prop.required) {
          propTypes.add('undefined');
        }
      }
      if (schema.additionalProperties === true) {
        this.additionalPropertiesType = 'any';
      } else if (schema.additionalProperties) {
        const propType = tsType(schema.additionalProperties, this.options, this.openApi);
        appendType(propType);
        this.additionalPropertiesType = [...propTypes].sort().join(' | ');
      }
    }
    if (schema.allOf) {
      schema.allOf.forEach(s => {
        if (isReferenceObject(s)) {
          // Resolve reference and collect properties
          const resolved = resolveRef(this.openApi, s.$ref) as SchemaObject;
          this.collectObject(resolved, propertiesByName);
        } else {
          this.collectObject(s, propertiesByName);
        }
      });
    }
  }
}
