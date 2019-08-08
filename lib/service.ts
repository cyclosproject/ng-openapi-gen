import { TagObject } from 'openapi3-ts';
import { GenType } from './gen-type';
import { fileName, serviceClass, tsComments, typeName } from './gen-utils';
import { Operation } from './operation';
import { Options } from './options';

/**
 * Context to generate a service
 */
export class Service extends GenType {

  tag: TagObject;

  constructor(tag: TagObject, public operations: Operation[], options: Options) {
    super(tag.name, options);

    this.typeName = serviceClass(typeName(tag.name), options);
    this.fileName = fileName(this.typeName);
    // Angular standards demand that services have a period separating them
    if (this.fileName.endsWith('-service')) {
      this.fileName = this.fileName.substring(0, this.fileName.length - '-service'.length) + '.service';
    }
    this.tsComments = tsComments(tag.description || '', 0);

    // Collect the imports
    for (const operation of operations) {
      for (const parameter of operation.parameters) {
        this.collectImports(parameter.spec.schema);
      }
      for (const securityGroup of operation.security) {
        securityGroup.forEach(security => this.collectImports(security.spec.schema));
      }
      if (operation.requestBody) {
        for (const content of operation.requestBody.content) {
          this.collectImports(content.spec.schema);
        }
      }
      for (const response of operation.allResponses) {
        const additional = response !== operation.successResponse;
        for (const content of response.content) {
          this.collectImports(content.spec.schema, additional, true);
        }
      }
    }
    this.updateImports();
  }

  protected pathToModels(): string {
    return '../models/';
  }
}
