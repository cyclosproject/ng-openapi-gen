import { modelFile, qualifiedName, unqualifiedName } from './gen-utils';
import { Importable } from './importable';
import { Options } from './options';

/** A general import */
export class Import implements Importable {
  name: string;
  typeName: string;
  qualifiedName: string;
  path: string;
  file: string;
  useAlias: boolean;
  fullPath: string;
  typeOnly: boolean;

  // Fields from Importable
  importName: string;
  importPath: string;
  importFile: string;
  importTypeName?: string;
  importQualifiedName?: string;

  constructor(name: string, typeName: string, qName: string, path: string, file: string, typeOnly: boolean) {
    this.name = name;
    this.typeName = typeName;
    this.qualifiedName = qName;
    this.useAlias = this.typeName !== this.qualifiedName;
    this.typeOnly = typeOnly;
    this.path = path;
    this.file = file;
    this.fullPath = `${this.path.split('/').filter(p => p.length).join('/')}/${this.file.split('/').filter(p => p.length).join('/')}`;

    this.importName = name;
    this.importPath = path;
    this.importFile = file;
    this.importTypeName = typeName;
    this.importQualifiedName = qName;
  }
}

/**
 * Manages the model imports to be added to a generated file
 */
export class Imports {
  private _imports = new Map<string, Import>();

  constructor(private options: Options, private currentTypeName?: string) {
  }

  /**
   * Adds an import
   */
  add(param: string | Importable, typeOnly: boolean) {
    let imp: Import;
    if (typeof param === 'string') {
      // A model
      const importTypeName = unqualifiedName(param, this.options);
      let importQualifiedName = qualifiedName(param, this.options);

      // Check for collision with current type name
      if (this.currentTypeName && importTypeName === this.currentTypeName) {
        // Add suffix to avoid collision
        let suffix = 1;
        let aliasedTypeName = `${importTypeName}_${suffix}`;
        while (this.hasImportWithTypeName(aliasedTypeName)) {
          suffix++;
          aliasedTypeName = `${importTypeName}_${suffix}`;
        }
        // Keep the original typeName for import, use alias for qualifiedName
        importQualifiedName = aliasedTypeName;
      }

      imp = new Import(param, importTypeName, importQualifiedName, 'models/', modelFile(param, this.options), typeOnly);
    } else {
      // An Importable
      imp = new Import(param.importName, param.importTypeName ?? param.importName, param.importQualifiedName ?? param.importName, `${param.importPath}`, param.importFile, typeOnly);
    }
    this._imports.set(imp.name, imp);
  }

  private hasImportWithTypeName(typeName: string): boolean {
    for (const imp of this._imports.values()) {
      if (imp.qualifiedName === typeName) {
        return true;
      }
    }
    return false;
  }

  toArray(): Import[] {
    const array = [...this._imports.values()];
    array.sort((a, b) => a.importName.localeCompare(b.importName, 'en'));
    return array;
  }

  get size() {
    return this._imports.size;
  }
}
