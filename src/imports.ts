
export class Import {
  constructor(public type: string, public file: string) { }
}

/**
 * Manages the imports to be added to a generated file
 */
export class Imports {
  private _imports = new Map<string, string>();

  constructor() {
  }

  /**
   * Adds an import
   */
  add(type: string, file: string) {
    this._imports.set(type, file);
  }

  toArray(): Import[] {
    const keys = [...this._imports.keys()];
    keys.sort();
    return keys.map(k => new Import(k, this._imports.get(k) as string));
  }
}
