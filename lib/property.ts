import { ReferenceObject, SchemaObject } from 'openapi3-ts';
import { tsComments, tsType } from './gen-utils';
import { Model } from './model';
import { Options } from './options';

/**
 * An object property
 */
export class Property {

  tsComments: string;
  type: string;

  constructor(
    public model: Model,
    public name: string,
    public schema: SchemaObject | ReferenceObject,
    public required: boolean,
    options: Options) {

    this.type = tsType(this.schema, options, model);

    const description = (schema as SchemaObject).description || '';
    this.tsComments = tsComments(description, 1, (schema as SchemaObject).deprecated);
  }
}
