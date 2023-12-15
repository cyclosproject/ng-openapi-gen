import { modelFile, qualifiedName } from './gen-utils';
import { Importable } from './importable';
import { Options } from './options';

/** A general import */
export class Import implements Importable {
  name: string;
  typeName: string;
  path: string;
  file: string;
  fullPath: string;

  // Fields from Importable
  importName: string;
  importPath: string;
  importFile: string;
  importTypeName?: string;

  constructor(name: string, typeName: string, path: string, file: string) {
    this.name = name;
    this.typeName = typeName;
    this.path = path;
    this.file = file;
    this.fullPath = `${this.path.split('/').filter(p => p.length).join('/')}/${this.file.split('/').filter(p => p.length).join('/')}`;

    this.importName = name;
    this.importPath = path;
    this.importFile = file;
    this.importTypeName = typeName;
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
  add(param: string | Importable) {
    let imp: Import;
    if (typeof param === 'string') {
      // A model
      imp = new Import(param, qualifiedName(param, this.options), 'models/', modelFile(param, this.options));
    } else {
      // An Importable
      imp = new Import(param.importName, param.importTypeName ?? param.importName, `${param.importPath}`, param.importFile);
    }
    this._imports.set(imp.name, imp);
  }

  toArray(): Import[] {
    const array = [...this._imports.values()];
    array.sort((a, b) => a.importName.localeCompare(b.importName));
    return array;
  }

  get size() {
    return this._imports.size;
  }
}
