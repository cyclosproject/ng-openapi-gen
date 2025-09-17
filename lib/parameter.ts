import { escapeId, tsComments, tsType } from './gen-utils';
import { OpenAPIObject, ParameterObject } from './openapi-typings';
import { Options } from './options';

type ParameterLocation = 'query' | 'header' | 'path' | 'cookie';

/**
 * An operation parameter
 */
export class Parameter {

  var: string;
  varAccess: string;
  name: string;
  tsComments: string;
  required: boolean;
  in: ParameterLocation;
  type: string;
  style?: string;
  explode?: boolean;
  parameterOptions: string;
  specific = false;

  constructor(public spec: ParameterObject, options: Options, openApi: OpenAPIObject) {
    this.name = spec.name;
    this.var = escapeId(this.name);
    this.varAccess = this.var.includes('\'') ? `[${this.var}]` : `.${this.var}`;
    this.tsComments = tsComments(spec.description || '', 0, spec.deprecated);
    this.in = (spec.in || 'query') as ParameterLocation;
    this.required = this.in === 'path' || spec.required || false;
    this.type = tsType(spec.schema, options, openApi);
    this.style = spec.style;
    this.explode = spec.explode;
    this.parameterOptions = this.createParameterOptions();
  }

  createParameterOptions(): string {
    const options: any = {};
    if (this.style) {
      options.style = this.style;
    }
    if (!!this.explode === this.explode) {
      options.explode = this.explode;
    }
    return JSON.stringify(options);
  }
}
