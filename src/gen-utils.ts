import jsesc from 'jsesc';
import { OpenAPIObject, ReferenceObject, SchemaObject } from 'openapi3-ts';
import { Options } from './options';
import { upperFirst, kebabCase, upperCase, deburr, camelCase } from 'lodash';

export const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

/**
 * Returns the simple name, that is, the last part after '/'
 */
export function simpleName(name: string): string {
  const pos = name.lastIndexOf('/');
  return name.substring(pos + 1);
}

/**
 * Returns the type (class) name for a given regular name
 */
export function typeName(name: string): string {
  return upperFirst(methodName(name));
}

/**
 * Returns the name of the enum constant for a given value
 */
export function enumName(value: string, options: Options): string {
  const name = toBasicChars(value, true);
  if (options.enumStyle === 'upper') {
    return upperCase(name).replace(/\s+/g, '_');
  } else {
    return upperFirst(camelCase(name));
  }
}

/**
 * Returns a suitable method name for the given name
 * @param name The raw name
 */
export function methodName(name: string) {
  return camelCase(toBasicChars(name, true));
}

/**
 * Returns the file name for a given type name
 */
export function fileName(text: string): string {
  return kebabCase(toBasicChars(text));
}

/**
 * Converts a text to a basic, letters / numbers / underscore representation.
 * When firstNonDigit is true, prepends the result with an uderscore if the first char is a digit.
 */
export function toBasicChars(text: string, firstNonDigit = false): string {
  text = deburr((text || '').trim());
  text = text.replace(/[^\w]+/g, '_');
  if (firstNonDigit && /[0-9]/.test(text.charAt(0))) {
    text = '_' + text;
  }
  return text;
}

/**
 * Returns the TypeScript comments for the given schema description, in a given indentation level
 */
export function tsComments(description: string | undefined, level: number) {
  const indent = '  '.repeat(level);
  if (description == undefined || description.length === 0) {
    return indent;
  }
  const lines = description.trim().split('\n');
  let result = '\n' + indent + '/**\n';
  lines.forEach(line => {
    result += indent + ' *' + (line === '' ? '' : ' ' + line.replace(/\*\//g, '* / ')) + '\n';
  });
  result += indent + ' */\n' + indent;
  return result;
}

/**
 * Applies the prefix and suffix to a model class name
 */
export function modelClass(baseName: string, options: Options) {
  return `${options.modelPrefix || ''}${baseName}${options.modelSuffix || ''}`;
}

/**
 * Applies the prefix and suffix to a service class name
 */
export function serviceClass(baseName: string, options: Options) {
  return `${options.servicePrefix || ''}${baseName}${options.serviceSuffix || 'Service'}`;
}

/**
 * Returns the TypeScript type for the given type and options
 */
export function tsType(schemaOrRef: SchemaObject | ReferenceObject | undefined, options: Options): string {
  if (schemaOrRef && (schemaOrRef as SchemaObject).nullable) {
    return `null | ${toType(schemaOrRef, options)}`;
  }
  return toType(schemaOrRef, options);
}

function toType(schemaOrRef: SchemaObject | ReferenceObject | undefined, options: Options): string {
  if (!schemaOrRef) {
    // No schema
    return 'any';
  }
  if (schemaOrRef.$ref) {
    // A reference
    return modelClass(simpleName(schemaOrRef.$ref), options);
  }
  const schema = schemaOrRef as SchemaObject;

  // An union of types
  const union = schema.oneOf || schema.anyOf || [];
  if (union.length > 0) {
    return union.map(u => toType(u, options)).join(' | ');
  }

  // All the types
  const allOf = schema.allOf || [];
  if (allOf.length > 0) {
    return allOf.map(u => toType(u, options)).join(' & ');
  }

  const type = schema.type || 'any';

  // An array
  if (type === 'array' || schema.items) {
    return `Array<${toType(schema.items || {}, options)}>`;
  }

  // An object
  if (type === 'object' || schema.properties) {
    let result = '{ ';
    let first = true;
    const properties = schema.properties || {};
    for (const propName of Object.keys(properties)) {
      const property = properties[propName];
      if (first) {
        first = false;
      } else {
        result += ', ';
      }
      result += `'${propName}': ${toType(property, options)}`;
    }
    if (schema.additionalProperties) {
      const additionalProperties = schema.additionalProperties === true ? {} : schema.additionalProperties;
      if (!first) {
        result += ', ';
      }
      result += `[key: string]: ${toType(additionalProperties, options)}`;
    }
    result += ' }';
    return result;
  }

  // Inline enum
  const enumValues = schema.enum || [];
  if (enumValues.length > 0) {
    if (type === 'number' || type === 'integer') {
      return enumValues.join(' | ');
    } else {
      return enumValues.map(v => `'${jsesc(v)}'`).join(' | ');
    }
  }

  // A Blob
  if (type === 'string' && schema.format === 'binary') {
    return 'Blob';
  }

  // A simple type
  return type === 'integer' ? 'number' : type;
}

/**
 * Resolves a reference
 * @param ref The reference name, such as #/components/schemas/Name, or just Name
 */
export function resolveRef(openApi: OpenAPIObject, ref: string): any {
  if (!ref.includes('/')) {
    ref = `#/components/schemas/${ref}`;
  }
  let current: any = null;
  for (let part of ref.split('/')) {
    part = part.trim();
    if (part === '#' || part === '') {
      current = openApi;
    } else if (current == null) {
      break;
    } else {
      current = current[part];
    }
  }
  if (current == null || typeof current !== 'object') {
    throw new Error(`Couldn't resolve reference ${ref}`);
  }
  return current as SchemaObject;
}
