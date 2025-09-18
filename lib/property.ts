import { escapeId, tsComments, tsType } from './gen-utils';
import { Model } from './model';
import { OpenAPIObject, ReferenceObject, SchemaObject } from './openapi-typings';
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
    public options: Options,
    public openApi: OpenAPIObject) {

    // Defer type resolution until after imports are finalized
    this.type = ''; // Will be set later
    this.identifier = escapeId(this.name);
    const description = (schema as SchemaObject).description || '';
    this.tsComments = tsComments(description, 1, (schema as SchemaObject).deprecated);
  }

  /**
   * Resolves the property type after imports are finalized
   */
  resolveType(): void {
    this.type = tsType(this.schema, this.options, this.openApi, this.model);
  }
}
