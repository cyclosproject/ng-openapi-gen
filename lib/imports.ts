import { unqualifiedName, qualifiedName, modelFile } from './gen-utils';
import { Options } from './options';

export class Import {
  name: string;
  typeName: string;
  qualifiedName: string;
  file: string;
  useAlias: boolean;
  constructor(name: string, pathToModels: string, options: Options) {
    this.name = name;
    this.typeName = unqualifiedName(name, options);
    this.qualifiedName = qualifiedName(name, options);
    this.useAlias = this.typeName !== this.qualifiedName;
    this.file = modelFile(pathToModels, name, options);
  }
}

/**
 * Manages the model imports to be added to a generated file
 */
export class Imports {
  private _imports = new Map<string, Import>();

  constructor(private options: Options) {
  }

  /**
   * Adds an import
   */
  add(name: string, pathToModels: string) {
    this._imports.set(name, new Import(name, pathToModels, this.options));
  }

  toArray(): Import[] {
    const keys = [...this._imports.keys()];
    keys.sort();
    return keys.map(k => this._imports.get(k) as Import);
  }
}
