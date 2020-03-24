import { Content } from './content';
import { Operation } from './operation';
import { Options } from './options';
import { tsComments } from './gen-utils';

/**
 * An operation has a variant per distinct possible body content
 */
export class OperationVariant {
  responseMethodName: string;
  resultType: string;
  responseType: string;
  accept: string;
  isVoid: boolean;
  isNumber: boolean;
  isBoolean: boolean;
  isOther: boolean;
  responseMethodTsComments: string;
  bodyMethodTsComments: string;

  constructor(
    public operation: Operation,
    public methodName: string,
    public requestBody: Content | null,
    public successResponse: Content | null,
    public options: Options) {
    this.responseMethodName = `${methodName}$Response`;
    if (successResponse) {
      this.resultType = successResponse.type;
      this.responseType = this.inferResponseType(successResponse.mediaType);
      this.accept = successResponse.mediaType;
    } else {
      this.resultType = 'void';
      this.responseType = 'text';
      this.accept = '*/*';
    }
    this.isVoid = this.resultType === 'void';
    this.isNumber = this.resultType === 'number';
    this.isBoolean = this.resultType === 'boolean';
    this.isOther = !this.isVoid && !this.isNumber && !this.isBoolean;
    this.responseMethodTsComments = tsComments(this.responseMethodDescription(), 1, operation.deprecated);
    this.bodyMethodTsComments = tsComments(this.bodyMethodDescription(), 1, operation.deprecated);
  }

  private inferResponseType(mediaType: string): string {
    mediaType = mediaType.toLowerCase();
    if (mediaType.endsWith('/json') || mediaType.endsWith('+json')) {
      return 'json';
    } else if (mediaType.startsWith('text/')) {
      return 'text';
    } else {
      return 'blob';
    }
  }

  private responseMethodDescription() {
    return `${this.descriptionPrefix()}This method provides access to the full \`HttpResponse\`, allowing access to response headers.
To access only the response body, use \`${this.methodName}()\` instead.${this.descriptionSuffix()}`;
  }

  private bodyMethodDescription() {
    return `${this.descriptionPrefix()}This method provides access to only to the response body.
To access the full response (for headers, for example), \`${this.responseMethodName}()\` instead.${this.descriptionSuffix()}`;
  }

  private descriptionPrefix() {
    let description = (this.operation.spec.description || '').trim();
    let summary = this.operation.spec.summary;
    if (summary) {
      if (!summary.endsWith('.')) {
        summary += '.';
      }
      description = summary + '\n\n' + description;
    }
    if (description !== '') {
      description += '\n\n';
    }
    return description;
  }

  private descriptionSuffix() {
    const sends = this.requestBody ? 'sends `' + this.requestBody.mediaType + '` and ' : '';
    const handles = this.requestBody
      ? `handles request body of type \`${this.requestBody.mediaType}\``
      : 'doesn\'t expect any request body';
    return `\n\nThis method ${sends}${handles}.`;
  }
}
