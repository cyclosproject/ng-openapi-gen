import { SchemaObject, ReferenceObject } from 'openapi3-ts';
import { tsComments, tsType, simpleName } from './gen-utils';
import { Options } from './options';
import { Model } from './model';
import { isReferenceObject, isSchemaObject } from '@loopback/openapi-v3-types';

/**
 * An object property
 */
export class Property {

  tsComments: string;
  type: string;

  constructor(
    model: Model,
    public name: string,
    public schema: SchemaObject | ReferenceObject,
    public required: boolean,
    options: Options) {
    this.type = tsType(this.schema, options);

    // if this property is a ref to the parent model (self-referencing)
    if (isReferenceObject(schema) && simpleName(schema.$ref) === model.name) {
      this.type = model.typeName;
    }
    else if (isSchemaObject(schema) && schema.type === 'array' && isReferenceObject(schema.items!)) {
      if (simpleName(schema.items.$ref) === model.name) {
        // TODO: What gen-utils method to call?
        this.type = `Array<${model.typeName}>`;
      }
    }

    const description = (schema as SchemaObject).description || '';
    this.tsComments = tsComments(description, 1, (schema as SchemaObject).deprecated);
  }
}
