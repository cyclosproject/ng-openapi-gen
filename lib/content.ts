import { tsType } from './gen-utils';
import { MediaTypeObject, OpenAPIObject } from './openapi-typings';
import { Options } from './options';

/**
 * Either a request body or response content
 */
export class Content {
  type: string;

  constructor(
    public mediaType: string,
    public spec: MediaTypeObject,
    public options: Options,
    public openApi: OpenAPIObject) {
    this.type = tsType(spec.schema, options, openApi);
  }
}
