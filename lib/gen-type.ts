import { ReferenceObject, SchemaObject } from 'openapi3-ts';
import { fileName, namespace, simpleName, typeName } from './gen-utils';
import { Importable } from './importable';
import { Import, Imports } from './imports';
import { Options } from './options';

/**
 * Base definitions of a generated type
 */
export abstract class GenType {

  /** Name of the generated type / class */
  typeName: string;

  /** Namespace, separated by '/' */
  namespace?: string;

  /** Camel-case qualified name of the type, including namespace */
  qualifiedName: string;

  /** Name of the generated file */
  fileName: string;

  /** TypeScript comments for this type */
  tsComments: string;

  pathToRoot: string;

  imports: Import[];
  private _imports: Imports;

  additionalDependencies: string[];
  private _additionalDependencies = new Set<string>();

  constructor(
    public name: string,
    typeNameTransform: (typeName: string, options: Options) => string,
    public options: Options) {

    this.typeName = typeNameTransform(name, options);
    this.namespace = namespace(name);
    this.fileName = fileName(this.typeName);
    this.qualifiedName = this.typeName;
    if (this.namespace) {
      this.fileName = this.namespace + '/' + this.fileName;
      this.qualifiedName = typeName(this.namespace, options) + this.typeName;
    }
    this._imports = new Imports(options);
  }

  protected addImport(param: string | Importable | null | undefined, typeOnly?: boolean) {
    if (param && !this.skipImport(param)) {
      this._imports.add(param, !!typeOnly);
    }
  }

  protected abstract skipImport(name: string | Importable): boolean;

  protected abstract initPathToRoot(): string;

  protected updateImports() {
    this.pathToRoot = this.initPathToRoot();
    this.imports = this._imports.toArray();
    for (const imp of this.imports) {
      imp.path = this.pathToRoot + imp.path;
    }
    this.additionalDependencies = [...this._additionalDependencies];
  }

  protected collectImports(schema: SchemaObject | ReferenceObject | undefined, additional = false, processOneOf = false): void {
    if (!schema) {
      return;
    } else if (schema.$ref) {
      const dep = simpleName(schema.$ref);
      if (additional) {
        this._additionalDependencies.add(dep);
      } else {
        this.addImport(dep);
      }
    } else {
      schema = schema as SchemaObject;
      (schema.oneOf || []).forEach(i => this.collectImports(i, additional));
      (schema.allOf || []).forEach(i => this.collectImports(i, additional));
      (schema.anyOf || []).forEach(i => this.collectImports(i, additional));
      if (processOneOf) {
        (schema.oneOf || []).forEach(i => this.collectImports(i, additional));
      }
      if (schema.items) {
        this.collectImports(schema.items, additional);
      }
      if (schema.properties) {
        const properties = schema.properties;
        Object.keys(properties).forEach(p => {
          const prop = properties[p];
          this.collectImports(prop, additional, true);
        });
      }
      if (typeof schema.additionalProperties === 'object') {
        this.collectImports(schema.additionalProperties, additional);
      }
    }
  }
}
