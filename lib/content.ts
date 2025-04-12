import { MediaTypeObject, OpenAPIObject } from 'openapi3-ts';
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
    public options: Options,
    public openApi: OpenAPIObject,
    method?: string) {
    const readOnly =
      (method && ['post', 'put'].includes(method) && options.experimental) ||
      false;
    this.type = tsType(spec.schema, options, openApi);

    if (readOnly) {
      this.type = `Utils.Writable<${this.type}>`;
    }
  }
}
