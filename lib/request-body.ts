import { Content } from './content';
import { tsComments } from './gen-utils';
import { RequestBodyObject } from './openapi-typings';
import { Options } from './options';

/**
 * Describes a request body
 */
export class RequestBody {

  tsComments: string;
  required: boolean;

  constructor(
    public spec: RequestBodyObject,
    public content: Content[],
    public options: Options) {

    this.tsComments = tsComments(spec.description, 2);
    this.required = spec.required === true;
  }

}
