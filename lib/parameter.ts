import { ParameterLocation, ParameterObject } from 'openapi3-ts';
import { escapeId, tsComments, tsType } from './gen-utils';
import { Options } from './options';

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

  constructor(public spec: ParameterObject, options: Options) {
    this.name = spec.name;
    this.var = escapeId(this.name);
    this.varAccess = this.var.includes('\'') ? `[${this.var}]` : `.${this.var}`;
    this.tsComments = tsComments(spec.description || '', 2, spec.deprecated);
    this.in = spec.in || 'query';
    this.required = this.in === 'path' || spec.required || false;
    this.type = tsType(spec.schema, options);
    this.style = spec.style;
    this.explode = spec.explode;
    this.parameterOptions = this.createParameterOptions();
  }

  createParameterOptions(): string {
    const options: any = {};
    if (this.style) {
      options.style = this.style;
    }
    if (this.explode) {
      options.explode = this.explode;
    }
    return JSON.stringify(options);
  }
}
