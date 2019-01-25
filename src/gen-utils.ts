import jsesc from 'jsesc';
import { OpenAPIObject, ReferenceObject, SchemaObject } from 'openapi3-ts';
import { Options } from './options';

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
  let result = '';
  let upNext = false;
  for (let i = 0; i < name.length; i++) {
    const c = name.charAt(i);
    const valid = /[\w]/.test(c);
    if (!valid) {
      upNext = true;
    } else if (upNext) {
      result += c.toUpperCase();
      upNext = false;
    } else if (result === '') {
      result = c.toUpperCase();
    } else {
      result += c;
    }
  }
  if (/[0-9]/.test(result.charAt(0))) {
    result = '_' + result;
  }
  return result;
}

/**
 * Returns a suitable method name for the given name
 * @param name The raw name
 */
export function methodName(name: string) {
  return lowerFirst(typeName(name));
}

/**
 * Transforms the first character to uppercase
 */
export function upperFirst(text: string): string {
  if (text == null) {
    return text;
  }
  switch (text.length) {
    case 0:
      return text;
    case 1:
      return text.toUpperCase();
    default:
      return text.charAt(0).toUpperCase() + text.substring(1);
  }
}

/**
 * Transforms the first character to lowercase
 */
export function lowerFirst(text: string): string {
  if (text == null) {
    return text;
  }
  switch (text.length) {
    case 0:
      return text;
    case 1:
      return text.toLowerCase();
    default:
      return text.charAt(0).toLowerCase() + text.substring(1);
  }
}

/**
 * Returns the file name for a given type name
 */
export function fileName(text: string): string {
  let result = '';
  let wasLower = false;
  for (let i = 0; i < text.length; i++) {
    const c = text.charAt(i);
    const isLower = /[a-z]/.test(c);
    if (!isLower && wasLower) {
      result += '-';
    }
    result += c.toLowerCase();
    wasLower = isLower;
  }
  return result.replace(/\-+/g, '-');
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
    result += indent + ' *' + (line === '' ? '' : ' ' + line) + '\n';
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
  return `${options.servicePrefix || ''}${baseName}${options.serviceSuffix || ''}`;
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

/**
 * Returns the name of the enumerated value
 * @param value The enum value
 */
export function enumName(value: string): string {
  return upperFirst(methodName(value));
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
    return union.map(u => toType(u, options)).join(' & ');
  }

  const type = schema.type || 'any';

  // An array
  if (type === 'array') {
    return `Array<${toType(schema.items || {}, options)}>`;
  }

  // An object
  if (type === 'object') {
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
