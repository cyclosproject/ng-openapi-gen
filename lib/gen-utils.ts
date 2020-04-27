import jsesc from 'jsesc';
import fs from 'fs-extra';
import path from 'path';
import { camelCase, deburr, kebabCase, upperCase, upperFirst } from 'lodash';
import { OpenAPIObject, ReferenceObject, SchemaObject } from 'openapi3-ts';
import { Options } from './options';
import { Model } from './model';

export const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];

/**
 * Returns the simple name, that is, the last part after '/'
 */
export function simpleName(name: string): string {
  const pos = name.lastIndexOf('/');
  return name.substring(pos + 1);
}

/**
 * Returns the unqualified model class name, that is, the last part after '.'
 */
export function unqualifiedName(name: string, options: Options): string {
  const pos = name.lastIndexOf('.');
  return modelClass(name.substring(pos + 1), options);
}

/**
 * Returns the qualified model class name, that is, the camelized namespace (if any) plus the unqualified name
 */
export function qualifiedName(name: string, options: Options): string {
  const ns = namespace(name);
  const unq = unqualifiedName(name, options);
  return ns ? typeName(ns) + unq : unq;
}

/**
 * Returns the file to import for a given model
 */
export function modelFile(pathToModels: string, name: string, options: Options): string {
  let dir = pathToModels || '';
  if (dir.endsWith('/')) {
    dir = dir.substr(0, dir.length - 1);
  }
  const ns = namespace(name);
  if (ns) {
    dir += `/${ns}`;
  }
  const file = unqualifiedName(name, options);
  return dir += '/' + fileName(file);
}

/**
 * Returns the namespace path, that is, the part before the last '.' splitted by '/' instead of '.'.
 * If there's no namespace, returns undefined.
 */
export function namespace(name: string): string | undefined {
  name = name.replace(/^\.+/g, '');
  name = name.replace(/\.+$/g, '');
  const pos = name.lastIndexOf('.');
  return pos < 0 ? undefined : name.substring(0, pos).replace('.', '/');
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
  let name = toBasicChars(value, true);
  if (options.enumStyle === 'upper') {
    name = upperCase(name).replace(/\s+/g, '_');
  } else {
    name = upperFirst(camelCase(name));
  }
  if (/^\d/.test(name)) {
    name = '$' + name;
  }
  return name;
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
export function tsComments(description: string | undefined, level: number, deprecated?: boolean) {
  const indent = '  '.repeat(level);
  if (description == undefined || description.length === 0) {
    return indent + (deprecated ? '/** @deprecated */' : '');
  }
  const lines = description.trim().split('\n');
  let result = '\n' + indent + '/**\n';
  lines.forEach(line => {
    result += indent + ' *' + (line === '' ? '' : ' ' + line.replace(/\*\//g, '* / ')) + '\n';
  });
  if (deprecated) {
    result += indent + ' *\n' + indent + ' * @deprecated\n';
  }
  result += indent + ' */\n' + indent;
  return result;
}

/**
 * Applies the prefix and suffix to a model class name
 */
export function modelClass(baseName: string, options: Options) {
  return `${options.modelPrefix || ''}${typeName(baseName)}${options.modelSuffix || ''}`;
}

/**
 * Applies the prefix and suffix to a service class name
 */
export function serviceClass(baseName: string, options: Options) {
  return `${options.servicePrefix || ''}${typeName(baseName)}${options.serviceSuffix || 'Service'}`;
}

/**
 * Escapes the name of a property / parameter if not valid JS identifier
 */
export function escapeId(name: string) {
  if (/^[a-zA-Z]\w+$/.test(name)) {
    return name;
  } else {
    return `'${name.replace(/\'/g, '\\\'')}'`;
  }
}

/**
 * Returns the TypeScript type for the given type and options
 */
export function tsType(schemaOrRef: SchemaObject | ReferenceObject | undefined, options: Options, container?: Model): string {
  if (schemaOrRef && (schemaOrRef as SchemaObject).nullable) {
    return `null | ${toType(schemaOrRef, options)}`;
  }
  return toType(schemaOrRef, options, container);
}

function toType(schemaOrRef: SchemaObject | ReferenceObject | undefined, options: Options, container?: Model): string {
  if (!schemaOrRef) {
    // No schema
    return 'any';
  }
  if (schemaOrRef.$ref) {
    // A reference
    const name = simpleName(schemaOrRef.$ref);
    if (container && container.name === name) {
      // When referencing the same container, use its type name
      return container.typeName;
    } else {
      return qualifiedName(name, options);
    }
  }
  const schema = schemaOrRef as SchemaObject;

  // An union of types
  const union = schema.oneOf || schema.anyOf || [];
  if (union.length > 0) {
    return union.map(u => toType(u, options, container)).join(' | ');
  }

  // All the types
  const allOf = schema.allOf || [];
  if (allOf.length > 0) {
    return allOf.map(u => toType(u, options, container)).join(' & ');
  }

  const type = schema.type || 'any';

  // An array
  if (type === 'array' || schema.items) {
    return `Array<${toType(schema.items || {}, options, container)}>`;
  }

  // An object
  if (type === 'object' || schema.properties) {
    let result = '{ ';
    let first = true;
    const properties = schema.properties || {};
    const required = schema.required;
    for (const propName of Object.keys(properties)) {
      const property = properties[propName];
      const propRequired = required && required.includes(propName);
      if (first) {
        first = false;
      } else {
        result += ', ';
      }
      result += `'${propName}'`;
      if (!propRequired) {
        result += '?';
      }
      result += `: ${toType(property, options, container)}`;
    }
    if (schema.additionalProperties) {
      const additionalProperties = schema.additionalProperties === true ? {} : schema.additionalProperties;
      if (!first) {
        result += ', ';
      }
      result += `[key: string]: ${toType(additionalProperties, options, container)}`;
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

/**
 * Recursively deletes a directory
 */
export function deleteDirRecursive(dir: string) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach((file: any) => {
      const curPath = path.join(dir, file);
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteDirRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dir);
  }
}

/**
 * Synchronizes the files from the source to the target directory. Optionally remove stale files.
 */
export function syncDirs(srcDir: string, destDir: string, removeStale: boolean): any {
  fs.ensureDirSync(destDir);
  const srcFiles = fs.readdirSync(srcDir);
  const destFiles = fs.readdirSync(destDir);
  for (const file of srcFiles) {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);
    if (fs.lstatSync(srcFile).isDirectory()) {
      // A directory: recursively sync
      syncDirs(srcFile, destFile, removeStale);
    } else {
      // Read the content of both files and update if they differ
      const srcContent = fs.readFileSync(srcFile, { encoding: 'utf-8' });
      const destContent = fs.existsSync(destFile) ? fs.readFileSync(destFile, { encoding: 'utf-8' }) : null;
      if (srcContent !== destContent) {
        fs.writeFileSync(destFile, srcContent, { encoding: 'utf-8' });
        console.debug('Wrote ' + destFile);
      }
    }
  }
  if (removeStale) {
    for (const file of destFiles) {
      const srcFile = path.join(srcDir, file);
      const destFile = path.join(destDir, file);
      if (!fs.existsSync(srcFile) && fs.lstatSync(destFile).isFile()) {
        fs.unlinkSync(destFile);
        console.debug('Removed stale file ' + destFile);
      }
    }
  }
}
