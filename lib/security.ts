import { tsComments, methodName } from './gen-utils';
import { SecuritySchemeObject, ApiKeySecurityScheme } from './openapi-typings';

/**
 * An operation security
 */
export class Security {
  /**
   * variable name
   */
  var: string;

  /**
   * Header Name
   */
  name: string;

  /**
   * Property Description
   */
  tsComments: string;

  /**
   * Location of security parameter
   */
  in: string;
  type: string;

  constructor(key: string, public spec: SecuritySchemeObject, public scope: string[] = []) {
    // Handle different types of security schemes
    if (spec.type === 'apiKey') {
      const apiKeySpec = spec as ApiKeySecurityScheme;
      this.name = apiKeySpec.name || '';
      this.in = apiKeySpec.in || 'header';
    } else {
      this.name = '';
      this.in = 'header';
    }

    this.var = methodName(key);
    this.tsComments = tsComments(spec.description || '', 2);
    this.type = 'string'; // Default type for security parameters
  }
}
