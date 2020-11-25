import { OpenAPIObject, ReferenceObject, SchemaObject } from 'openapi3-ts';
import { escapeId, tsComments, tsType } from './gen-utils';
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
    options: Options,
    openApi: OpenAPIObject) {

    this.type = tsType(this.schema, options, openApi, model);
    if ((schema as SchemaObject)?.nullable && !this.type.startsWith('null | ')) {
      this.type = 'null | ' + this.type;
    }
    this.identifier = escapeId(this.name);
    const description = (schema as SchemaObject).description || '';
    this.tsComments = tsComments(description, 1, (schema as SchemaObject).deprecated);
  }
}
