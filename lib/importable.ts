/**
 * An artifact that can be imported
 */
export interface Importable {
  importName: string;
  importPath: string;
  importFile: string;
  importTypeName?: string;
  importQualifiedName?: string;
}
