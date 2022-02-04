/* tslint:disable */
/* eslint-disable */
import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { BaseService } from '../base-service';
import { ApiConfiguration } from '../api-configuration';
import { StrictHttpResponse } from '../strict-http-response';
import { RequestBuilder } from '../request-builder';
import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class ApiService extends BaseService {
  constructor(
    config: ApiConfiguration,
    http: HttpClient
  ) {
    super(config, http);
  }

  /**
   * Path part for operation getPath1
   */
  static readonly GetPath1Path = '/path1';

  /**
   * Get a default string response.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `getPath1()` instead.
   *
   * This method doesn't expect any request body.
   */
  getPath1$Response(params?: {
  }): Observable<StrictHttpResponse<string>> {

    const rb = new RequestBuilder(this.rootUrl, ApiService.GetPath1Path, 'get');
    if (params) {
    }

    return this.http.request(rb.build({
      responseType: 'json',
      accept: 'application/json'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return r as StrictHttpResponse<string>;
      })
    );
  }

  /**
   * Get a default string response.
   *
   *
   *
   * This method provides access to only to the response body.
   * To access the full response (for headers, for example), `getPath1$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  getPath1(params?: {
  }): Observable<string> {

    return this.getPath1$Response(params).pipe(
      map((r: StrictHttpResponse<string>) => r.body as string)
    );
  }

  /**
   * Path part for operation getPath2
   */
  static readonly GetPath2Path = '/path2';

  /**
   * Get a default number response.
   *
   *
   *
   * This method provides access to the full `HttpResponse`, allowing access to response headers.
   * To access only the response body, use `getPath2()` instead.
   *
   * This method doesn't expect any request body.
   */
  getPath2$Response(params?: {
  }): Observable<StrictHttpResponse<number>> {

    const rb = new RequestBuilder(this.rootUrl, ApiService.GetPath2Path, 'get');
    if (params) {
    }

    return this.http.request(rb.build({
      responseType: 'json',
      accept: 'application/json'
    })).pipe(
      filter((r: any) => r instanceof HttpResponse),
      map((r: HttpResponse<any>) => {
        return (r as HttpResponse<any>).clone({ body: parseFloat(String((r as HttpResponse<any>).body)) }) as StrictHttpResponse<number>;
      })
    );
  }

  /**
   * Get a default number response.
   *
   *
   *
   * This method provides access to only to the response body.
   * To access the full response (for headers, for example), `getPath2$Response()` instead.
   *
   * This method doesn't expect any request body.
   */
  getPath2(params?: {
  }): Observable<number> {

    return this.getPath2$Response(params).pipe(
      map((r: StrictHttpResponse<number>) => r.body as number)
    );
  }

}
