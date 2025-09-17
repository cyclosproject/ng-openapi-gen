import { GenType } from './gen-type';
import { serviceClass, tsComments } from './gen-utils';
import { TagObject } from './openapi-typings';
import { Operation } from './operation';
import { Options } from './options';

/**
 * Context to generate a service
 */
export class Service extends GenType {

  constructor(tag: TagObject, public operations: Operation[], options: Options) {
    super(tag.name, serviceClass, options);

    // Angular standards demand that services have a period separating them
    if (this.fileName.endsWith('-service')) {
      this.fileName = this.fileName.substring(0, this.fileName.length - '-service'.length) + '.service';
    }
    this.tsComments = tsComments(tag.description || '', 0);

    // Collect the imports
    for (const operation of operations) {
      operation.variants.forEach(variant => {
        // Import the variant fn
        this.addImport(variant);
        // Import the variant parameters
        this.addImport(variant.paramsImport);
        // Import the variant result type
        this.collectImports(variant.successResponse?.spec?.schema);
        // Add the request body additional dependencies
        this.collectImports(variant.requestBody?.spec?.schema, true);
      });

      // Add the parameters as additional dependencies
      for (const parameter of operation.parameters) {
        this.collectImports(parameter.spec.schema, true);
      }

      // Add the responses imports as additional dependencies
      for (const resp of operation.allResponses) {
        for (const content of resp.content ?? []) {
          this.collectImports(content.spec?.schema, true);
        }
      }

      // Security schemes don't have schemas to import in newer OpenAPI versions
      // for (const securityGroup of operation.security) {
      //   securityGroup.forEach(security => this.collectImports(security.spec.schema));
      // }
    }
    this.updateImports();
  }

  protected skipImport(): boolean {
    return false;
  }

  protected initPathToRoot(): string {
    return '../';
  }
}
