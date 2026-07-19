import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import options from './xquik-search.config.json';
import xquikSearchSpec from './xquik-search.json';
import { OpenAPIObject } from '../lib/openapi-typings';

const spec = xquikSearchSpec as OpenAPIObject;

describe('Generation tests using xquik-search.json', () => {
  it('keeps the Xquik search query and api key contract', () => {
    const gen = new NgOpenApiGen(spec, options);
    gen.generate();

    expect(gen.globals.rootUrl).toBe('https://xquik.com');
    expect(gen.services.size).toBe(1);

    const service = gen.services.get('Tweets');
    expect(service).toBeDefined();
    expect(service?.operations.length).toBe(1);

    const operation = gen.operations.get('searchTweets');
    expect(operation).toBeDefined();
    expect(operation?.path).toBe('/api/v1/x/tweets/search');
    expect(operation?.method).toBe('get');
    expect(operation?.parameters.map(parameter => parameter.name)).toEqual([
      'q',
      'queryType',
      'cursor',
      'limit',
    ]);
    expect(operation?.parameters.map(parameter => parameter.in)).toEqual([
      'query',
      'query',
      'query',
      'query',
    ]);
    expect(operation?.parameters[0]?.required).toBe(true);
    expect(operation?.security[0]?.[0]?.name).toBe('x-api-key');
    expect(operation?.security[0]?.[0]?.in).toBe('header');
    expect(operation?.security[1]?.[0]?.var).toBe('oauthBearer');
    expect(operation?.security[1]?.[0]?.spec).toMatchObject({
      scheme: 'bearer',
      type: 'http',
    });
    expect(operation?.security[2]).toEqual([]);
  });
});
