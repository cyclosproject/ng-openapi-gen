import { MediaTypeObject } from 'openapi3-ts';
import { Options } from './options';
import { tsType } from './gen-utils';

/**
 * Either a request body or response content
 */
export class Content {

  type: string;

  constructor(
    public mediaType: string,
    public spec: MediaTypeObject,
    public options: Options) {
    this.type = tsType(spec.schema, options);
  }
}
