import { ReferenceObject, SchemaObject } from 'openapi3-ts';
import { fileName, simpleName, modelClass } from './gen-utils';
import { Import, Imports } from './imports';
import { Options } from './options';

/**
 * Base definitions of a generated type
 */
export abstract class GenType {

  /** Name of the generated type / class */
  public typeName: string;

  /** Name of the generated file */
  public fileName: string;

  /** TypeScript comments for this type */
  public tsComments: string;

  private _imports: Imports = new Imports();
  public imports: Import[];
  private _additionalDependencies = new Set<string>();
  public additionalDependencies: string[];

  constructor(
    public name: string,
    /** Generation options */
    public options: Options) {
  }

  protected addImport(type: string) {
    type = modelClass(type, this.options);
    if (type && this.typeName !== type) {
      // Don't add an import to this own file
      this._imports.add(type, `${this.pathToModels()}${fileName(type)}`);
    }
  }

  protected updateImports() {
    this.imports = this._imports.toArray();
    this.additionalDependencies = [...this._additionalDependencies];
  }

  protected collectImports(schema: SchemaObject | ReferenceObject | undefined, additional = false, processOneOf = false): void {
    if (!schema) {
      return;
    } else if (schema.$ref) {
      const dep = simpleName(schema.$ref);
      if (additional) {
        this._additionalDependencies.add(modelClass(dep, this.options));
      } else {
        this.addImport(dep);
      }
    } else {
      schema = schema as SchemaObject;
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
        Object.keys(properties).forEach(p => this.collectImports(properties[p], additional));
      }
      if (typeof schema.additionalProperties === 'object') {
        this.collectImports(schema.additionalProperties, additional);
      }
    }
  }

  /**
   * Must be implemented to return the relative path to the models, ending with `/`
   */
  protected abstract pathToModels(): string;
}
