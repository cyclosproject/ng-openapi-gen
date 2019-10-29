import { SchemaObject, ReferenceObject } from 'openapi3-ts';
import { tsComments, tsType } from './gen-utils';
import { Options } from './options';

/**
 * An object property
 */
export class Property {

  tsComments: string;
  type: string;

  constructor(
    public name: string,
    public schema: SchemaObject | ReferenceObject,
    public required: boolean,
    options: Options) {

    this.type = tsType(this.schema, options);
    const description = (schema as SchemaObject).description || '';
    this.tsComments = tsComments(description, 1);
  }
}
