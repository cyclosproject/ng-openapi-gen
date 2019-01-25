import { ReferenceObject, SchemaObject } from 'openapi3-ts';
import { fileName, simpleName } from './gen-utils';
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

  constructor(
    public name: string,
    /** Generation options */
    public options: Options) {
  }

  protected addImport(type: string) {
    if (type && this.typeName !== type) {
      // Don't add an import to this own file
      this._imports.add(type, `${this.pathToModels()}${fileName(type)}`);
    }
  }

  protected updateImports() {
    this.imports = this._imports.toArray();
  }

  protected collectImports(schema: SchemaObject | ReferenceObject | undefined): void {
    if (!schema) {
      return;
    } else if (schema.$ref) {
      this.addImport(simpleName(schema.$ref));
    } else {
      schema = schema as SchemaObject;
      (schema.allOf || []).forEach(i => this.collectImports(i));
      (schema.anyOf || []).forEach(i => this.collectImports(i));
      (schema.oneOf || []).forEach(i => this.collectImports(i));
      if (schema.type === 'array') {
        this.collectImports(schema.items);
      } else if (schema.type === 'object') {
        const properties = schema.properties || {};
        Object.keys(properties).forEach(p => this.collectImports(properties[p]));
        if (typeof schema.additionalProperties === 'object') {
          this.collectImports(schema.additionalProperties);
        }
      }
    }
  }

  /**
   * Must be implemented to return the relative path to the models, ending with `/`
   */
  protected abstract pathToModels(): string;
}
