import { ReferenceObject, SchemaObject } from 'openapi3-ts';
import { tsComments, tsType, escapeId } from './gen-utils';
import { Model } from './model';
import { Options } from './options';

/**
 * An object property
 */
export class Property {

  identifier: string;
  tsComments: string;
  type: string;

  constructor(
    public model: Model,
    public name: string,
    public schema: SchemaObject | ReferenceObject,
    public required: boolean,
    options: Options) {

    this.type = tsType(this.schema, options, model);
    this.identifier = escapeId(this.name);

    const description = (schema as SchemaObject).description || '';
    this.tsComments = tsComments(description, 1, (schema as SchemaObject).deprecated);
  }
}
