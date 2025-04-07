import fs from 'fs-extra';
import jsesc from 'jsesc';
import { camelCase, deburr, kebabCase, upperCase, upperFirst } from 'lodash';
import { OpenAPIObject, ReferenceObject, SchemaObject } from 'openapi3-ts';
import path from 'path';
import { Logger } from './logger';
import { Model } from './model';
import { Options } from './options';

export const HTTP_METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'];
type SchemaOrRef = SchemaObject | ReferenceObject;

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
 * Returns the filename where to write a model with the given name
 */
export function modelFile(name: string, options: Options): string {
  let result = '';
  const ns = namespace(name);
  if (ns) {
    result += `/${ns}`;
  }
  const file = unqualifiedName(name, options);
  return result += '/' + fileName(file);
}

/**
 * Returns the namespace path, that is, the part before the last '.' split by '/' instead of '.'.
 * If there's no namespace, returns undefined.
 */
export function namespace(name: string): string | undefined {
  name = name.replace(/^\.+/g, '');
  name = name.replace(/\.+$/g, '');
  const pos = name.lastIndexOf('.');
  return pos < 0 ? undefined : name.substring(0, pos).replace(/\./g, '/');
}

const RESERVED_KEYWORDS = ['abstract', 'arguments', 'await', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'double', 'else', 'enum', 'eval', 'export', 'extends', 'false', 'final', 'finally', 'float', 'for', 'function', 'goto', 'if', 'implements', 'import', 'in', 'instanceof', 'int', 'interface', 'let', 'long', 'native', 'new', 'null', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'true', 'try', 'typeof', 'var', 'void', 'volatile', 'while', 'with', 'yield'];

/**
 * If the given name is a JS reserved keyword, suffix it with a `$` character
 */
export function ensureNotReserved(name: string): string {
  return RESERVED_KEYWORDS.includes(name) ? name + '$' : name;
}

/**
 * Returns the type (class) name for a given regular name
 */
export function typeName(name: string, options?: Options): string {
  if (options?.camelizeModelNames === false) {
    return upperFirst(toBasicChars(name, true));
  } else {
    return upperFirst(methodName(name));
  }
}

/**
 * Returns the name of the enum constant for a given value
 */
export function enumName(value: string, options: Options): string {
  let name = toBasicChars(value, true);
  if (options.enumStyle === 'ignorecase') {
    return name;
  } else if (options.enumStyle === 'upper') {
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
  text = text.replace(/[^\w$]+/g, '_');
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
  if (description === undefined || description.length === 0) {
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
  return `${options.modelPrefix || ''}${typeName(baseName, options)}${options.modelSuffix || ''}`;
}

/**
 * Applies the prefix and suffix to a service class name
 */
export function serviceClass(baseName: string, options: Options) {
  return `${options.servicePrefix || ''}${typeName(baseName, options)}${options.serviceSuffix || 'Service'}`;
}

/**
 * Escapes the name of a property / parameter if not valid JS identifier
 */
export function escapeId(name: string) {
  if (/^[a-zA-Z]\w*$/.test(name)) {
    return name;
  } else {
    return `'${name.replace(/\'/g, '\\\'')}'`;
  }
}

/**
 * Appends | null to the given type
 */
function maybeAppendNull(type: string, nullable: boolean) {
  if (` ${type} `.includes('null') || !nullable) {
    // The type itself already includes null
    return type;
  }
  return (type.includes(' ') ? `(${type})` : type) + (nullable ? ' | null' : '');
}

function rawTsType(schema: SchemaObject, options: Options, openApi: OpenAPIObject, container?: Model): string {
  // An union of types
  const union = schema.oneOf || schema.anyOf || [];
  if (union.length > 0) {
    if (union.length > 1) {
      return `(${union.map(u => tsType(u, options, openApi, container)).join(' | ')})`;
    } else {
      return union.map(u => tsType(u, options, openApi, container)).join(' | ');
    }
  }

  const type = schema.type || 'any';

  // An array
  if (type === 'array' || schema.items) {
    const items = schema.items || {};
    const itemsType = tsType(items, options, openApi, container);
    return `Array<${itemsType}>`;
  }

  // All the types
  const allOf = schema.allOf || [];
  let intersectionType: string[] = [];
  if (allOf.length > 0) {
    intersectionType = allOf.map(u => tsType(u, options, openApi, container));
  }

  // An object
  if (type === 'object' || schema.properties) {
    let result = '{\n';
    const properties = schema.properties || {};
    const required = schema.required;

    for (const baseSchema of allOf) {
      const discriminator = tryGetDiscriminator(baseSchema, schema, openApi);
      if (discriminator) {
        result += `'${discriminator.propName}': '${discriminator.value}';\n`;
      }
    }

    for (const propName of Object.keys(properties)) {
      const property = properties[propName];
      if (!property) {
        continue;
      }
      if ((property as SchemaObject).description) {
        result += tsComments((property as SchemaObject).description, 0, (property as SchemaObject).deprecated);
      }
      result += `'${propName}'`;
      const propRequired = required && required.includes(propName);
      if (!propRequired) {
        result += '?';
      }
      const propertyType = tsType(property, options, openApi, container);
      result += `: ${propertyType};\n`;
    }
    if (schema.additionalProperties) {
      const additionalProperties = schema.additionalProperties === true ? {} : schema.additionalProperties;
      result += `[key: string]: ${tsType(additionalProperties, options, openApi, container)};\n`;
    }
    result += '}';
    intersectionType.push(result);
  }

  if (intersectionType.length > 0) {
    return intersectionType.join(' & ');
  }

  // Inline enum
  const enumValues = schema.enum || ((schema as any).const ? [(schema as any).const] : []);
  if (enumValues.length > 0) {
    if (type === 'number' || type === 'integer' || type === 'boolean') {
      return enumValues.join(' | ');
    } else {
      return enumValues.map(v => `'${jsesc(v)}'`).join(' | ');
    }
  }

  // A Blob
  if (type === 'string' && schema.format === 'binary') {
    return 'Blob';
  }

  // A simple type (integer doesn't exist as type in JS, use number instead)
  return type === 'integer' ? 'number' : type;
}

/**
 * Returns the TypeScript type for the given type and options
 */
export function tsType(schemaOrRef: SchemaOrRef | undefined, options: Options, openApi: OpenAPIObject, container?: Model): string {
  if (!schemaOrRef) {
    // No schema
    return 'any';
  }

  if (schemaOrRef.$ref) {
    // A reference
    const resolved = resolveRef(openApi, schemaOrRef.$ref) as SchemaObject;
    const name = simpleName(schemaOrRef.$ref);
    // When referencing the same container, use its type name
    return maybeAppendNull((container && container.name === name) ? container.typeName : qualifiedName(name, options), !!resolved.nullable);
  }

  // Resolve the actual type (maybe nullable)
  const schema = schemaOrRef as SchemaObject;
  const type = rawTsType(schema, options, openApi, container);
  return maybeAppendNull(type, !!schema.nullable);
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
export function syncDirs(srcDir: string, destDir: string, removeStale: boolean, logger: Logger): any {
  fs.ensureDirSync(destDir);
  const srcFiles = fs.readdirSync(srcDir);
  const destFiles = fs.readdirSync(destDir);
  for (const file of srcFiles) {
    const srcFile = path.join(srcDir, file);
    const destFile = path.join(destDir, file);
    if (fs.lstatSync(srcFile).isDirectory()) {
      // A directory: recursively sync
      syncDirs(srcFile, destFile, removeStale, logger);
    } else {
      // Read the content of both files and update if they differ
      const srcContent = fs.readFileSync(srcFile, { encoding: 'utf-8' });
      const destContent = fs.existsSync(destFile) ? fs.readFileSync(destFile, { encoding: 'utf-8' }) : null;
      if (srcContent !== destContent) {
        fs.writeFileSync(destFile, srcContent, { encoding: 'utf-8' });
        logger.debug('Wrote ' + destFile);
      }
    }
  }
  if (removeStale) {
    for (const file of destFiles) {
      const srcFile = path.join(srcDir, file);
      const destFile = path.join(destDir, file);
      if (!fs.existsSync(srcFile) && fs.lstatSync(destFile).isFile()) {
        fs.unlinkSync(destFile);
        logger.debug('Removed stale file ' + destFile);
      }
    }
  }
}

/**
 * Tries to get a discriminator info from a base schema and for a derived one.
 */
function tryGetDiscriminator(baseSchemaOrRef: SchemaObject | ReferenceObject, derivedSchema: SchemaObject, openApi: OpenAPIObject) {
  const baseSchema = (baseSchemaOrRef.$ref ? resolveRef(openApi, baseSchemaOrRef.$ref) : baseSchemaOrRef) as SchemaObject;
  const discriminatorProp = baseSchema.discriminator?.propertyName;
  if (discriminatorProp) {
    const discriminatorValue = tryGetDiscriminatorValue(baseSchema, derivedSchema, openApi);
    if (discriminatorValue) {
      return {
        propName: discriminatorProp,
        value: discriminatorValue
      };
    }
  }
  return undefined;
}

/**
 * Tries to get a discriminator value from a base schema and for a derived one.
 */
function tryGetDiscriminatorValue(baseSchema: SchemaObject, derivedSchema: SchemaObject, openApi: OpenAPIObject): string | null {
  const mapping = baseSchema.discriminator?.mapping;

  if (mapping) {
    const mappingIndex = Object.values(mapping).findIndex((ref) => resolveRef(openApi, ref) === derivedSchema);
    return Object.keys(mapping)[mappingIndex] ?? null;
  }

  return null;
}
