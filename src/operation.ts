import { OperationObject, PathItemObject, OpenAPIObject, ParameterObject, ReferenceObject, RequestBodyObject, ContentObject, MediaTypeObject, ResponseObject } from 'openapi3-ts';
import { Parameter } from './parameter';
import { Options } from './options';
import { resolveRef } from './gen-utils';
import { Content } from './content';
import { Response } from './response';

/**
 * An operation
 */
export class Operation {
  tags: string[];
  parameters: Parameter[] = [];
  hasBody: boolean;
  bodyRequired: boolean;
  bodyContent: Content[] = [];
  successResponse?: Response;
  allResponses: Response[] = [];

  constructor(
    public openApi: OpenAPIObject,
    public path: string,
    public pathSpec: PathItemObject,
    public method: string,
    public spec: OperationObject,
    public options: Options) {
    this.tags = spec.tags || [];

    // Add both the common and specific parameters
    this.parameters = [
      ...this.collectParameters(pathSpec.parameters),
      ...this.collectParameters(spec.parameters),
    ];
    let body = spec.requestBody;
    this.hasBody = !!body;
    if (body) {
      if (body.$ref) {
        body = resolveRef(this.openApi, body.$ref);
      }
      body = body as RequestBodyObject;
      this.bodyRequired = body.required === true;
      this.bodyContent = this.collectContent(body.content);
    }
    const responses = this.collectResponses();
    this.successResponse = responses.success;
    this.allResponses = responses.all;
  }

  private collectParameters(params: (ParameterObject | ReferenceObject)[] | undefined): Parameter[] {
    const result: Parameter[] = [];
    if (params) {
      for (let param of params) {
        if (param.$ref) {
          param = resolveRef(this.openApi, param.$ref);
        }
        result.push(new Parameter(param as ParameterObject, this.options));
      }
    }
    return result;
  }

  private collectContent(desc: ContentObject | undefined): Content[] {
    const result: Content[] = [];
    if (desc) {
      for (const type of Object.keys(desc)) {
        result.push(new Content(type, desc[type] as MediaTypeObject, this.options));
      }
    }
    return result;
  }

  private collectResponses(): { success: Response | undefined, all: Response[] } {
    let successResponse: Response | undefined = undefined;
    const allResponses: Response[] = [];
    const responses = this.spec.responses || {};
    for (const statusCode of Object.keys(responses)) {
      const responseDesc = responses[statusCode] as ResponseObject;
      const response = new Response(
        statusCode,
        responseDesc.description || '',
        this.collectContent(responseDesc.content),
        this.options);
      allResponses.push(response);
      const statusInt = Number.parseInt(statusCode.trim(), 10);
      if (!successResponse && statusInt >= 200 && statusInt < 300) {
        successResponse = response;
      }
    }
    return { success: successResponse, all: allResponses };
  }
}