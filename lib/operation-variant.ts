import { upperFirst } from 'lodash';
import { SchemaObject } from 'openapi3-ts';
import { Content } from './content';
import { GenType } from './gen-type';
import { ensureNotReserved, fileName, resolveRef, tsComments } from './gen-utils';
import { Importable } from './importable';
import { Operation } from './operation';
import { Options } from './options';

/**
 * An operation has a variant per distinct possible body content
 */
export class OperationVariant extends GenType implements Importable {
  responseMethodName: string;
  resultType: string;
  responseType: string;
  accept: string;
  isVoid: boolean;
  isNumber: boolean;
  isBoolean: boolean;
  isOther: boolean;
  responseMethodTsComments: string;
  bodyMethodTsComments: string;

  paramsType: string;
  paramsImport: Importable;

  importName: string;
  importPath: string;
  importFile: string;

  constructor(
    public operation: Operation,
    public methodName: string,
    public requestBody: Content | null,
    public successResponse: Content | null,
    public options: Options) {

    super(methodName, n => n, options);

    this.responseMethodName = `${methodName}$Response`;
    if (successResponse) {
      this.resultType = successResponse.type;
      this.responseType = this.inferResponseType(successResponse, operation, options);
      this.accept = successResponse.mediaType;
    } else {
      this.resultType = 'void';
      this.responseType = 'text';
      this.accept = '*/*';
    }
    this.isVoid = this.resultType === 'void';
    this.isNumber = this.resultType === 'number';
    this.isBoolean = this.resultType === 'boolean';
    this.isOther = !this.isVoid && !this.isNumber && !this.isBoolean;
    this.responseMethodTsComments = tsComments(this.responseMethodDescription(), 1, operation.deprecated);
    this.bodyMethodTsComments = tsComments(this.bodyMethodDescription(), 1, operation.deprecated);

    this.importPath = 'fn/' + fileName(this.operation.tags[0] || options.defaultTag || 'operations');
    this.importName = ensureNotReserved(methodName);
    this.importFile = fileName(methodName);

    this.paramsType = `${upperFirst(methodName)}$Params`;
    this.paramsImport = {
      importName: this.paramsType,
      importFile: this.importFile,
      importPath: this.importPath
    };

    // Collect parameter imports
    for (const parameter of this.operation.parameters) {
      this.collectImports(parameter.spec.schema, false, true);
    }
    // Collect the request body imports
    this.collectImports(this.requestBody?.spec?.schema);
    // Collect the response imports
    this.collectImports(this.successResponse?.spec?.schema);

    // Finally, update the imports
    this.updateImports();
  }

  private inferResponseType(successResponse: Content, operation: Operation, { customizedResponseType = {} }: Pick<Options, 'customizedResponseType'>): string {
    const customizedResponseTypeByPath = customizedResponseType[operation.path];
    if (customizedResponseTypeByPath) {
      return customizedResponseTypeByPath.toUse;
    }

    // When the schema is in binary format, return 'blob'
    let schemaOrRef = successResponse.spec?.schema || { type: 'string' };
    if (schemaOrRef.$ref) {
      schemaOrRef = resolveRef(operation.openApi, schemaOrRef.$ref);
    }
    const schema = schemaOrRef as SchemaObject;
    if (schema.format === 'binary') {
      return 'blob';
    }

    const mediaType = successResponse.mediaType.toLowerCase();
    if (mediaType.includes('/json') || mediaType.includes('+json')) {
      return 'json';
    } else if (mediaType.startsWith('text/')) {
      return 'text';
    } else {
      return 'blob';
    }
  }

  private responseMethodDescription() {
    return `${this.descriptionPrefix()}This method provides access to the full \`HttpResponse\`, allowing access to response headers.
To access only the response body, use \`${this.methodName}()\` instead.${this.descriptionSuffix()}`;
  }

  private bodyMethodDescription() {
    return `${this.descriptionPrefix()}This method provides access only to the response body.
To access the full response (for headers, for example), \`${this.responseMethodName}()\` instead.${this.descriptionSuffix()}`;
  }

  private descriptionPrefix() {
    let description = (this.operation.spec.description || '').trim();
    let summary = this.operation.spec.summary;
    if (summary) {
      if (!summary.endsWith('.')) {
        summary += '.';
      }
      description = summary + '\n\n' + description;
    }
    if (description !== '') {
      description += '\n\n';
    }
    return description;
  }

  private descriptionSuffix() {
    const sends = this.requestBody ? 'sends `' + this.requestBody.mediaType + '` and ' : '';
    const handles = this.requestBody
      ? `handles request body of type \`${this.requestBody.mediaType}\``
      : 'doesn\'t expect any request body';
    return `\n\nThis method ${sends}${handles}.`;
  }

  protected skipImport(): boolean {
    return false;
  }

  protected initPathToRoot(): string {
    return this.importPath.split(/\//g).map(() => '..').join('/') + '/';
  }
}
