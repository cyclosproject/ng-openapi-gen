import { TagObject } from 'openapi3-ts';
import { GenType } from './gen-type';
import { fileName, serviceClass, tsComments } from './gen-utils';
import { Operation } from './operation';
import { Options } from './options';

/**
 * Context to generate a service
 */
export class Service extends GenType {

  tag: TagObject;

  constructor(tag: TagObject, public operations: Operation[], options: Options) {
    super(tag.name, options);

    this.typeName = serviceClass(tag.name, options);
    this.fileName = fileName(this.typeName);
    this.tsComments = tsComments(tag.description || '', 0);

    // Collect the imports
    for (const operation of operations) {
      for (const parameter of operation.parameters) {
        this.collectImports(parameter.spec.schema);
      }
      for (const content of operation.bodyContent) {
        this.collectImports(content.spec.schema);
      }
      for (const response of operation.allResponses) {
        for (const content of response.content) {
          this.collectImports(content.spec.schema);
        }
      }
    }
    this.updateImports();
  }

  protected pathToModels(): string {
    return '../models/';
  }
}