import { SecuritySchemeObject } from 'openapi3-ts';
import { tsComments, tsType, methodName } from './gen-utils';
import { Options } from './options';

/**
 * An operation security
 */
export class Security {

  var: string;
  name: string;
  tsComments: string;
  required: boolean;
  in: string;
  type: string;

  constructor(public spec: SecuritySchemeObject, options: Options) {
    this.name = spec.name || '';
    this.var = methodName(this.name);
    this.tsComments = tsComments(spec.description || '', 2);
    this.in = spec.in || 'header';
    this.required = this.in === 'path' || spec.required || false;
    this.type = tsType(spec.schema, options);
  }
}
