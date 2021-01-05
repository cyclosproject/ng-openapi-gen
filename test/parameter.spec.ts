import { Parameter } from '../lib/parameter';

const parameterNotExploded = new Parameter(
  {
    explode: false,
    name: 'par1',
    in: 'query',
    description: 'Description of par1',
    style: 'form',
    schema: {
      type: 'array',
      items: {
        type: 'string'
      }
    }
  },
  {
    input: 'fake.json'
  },
  {
    openapi: '',
    info: {
      title: 'fake open api',
      version: '3.0.0'
    },
    paths: []
  });

const parameterExploded = new Parameter(
  {
    explode: true,
    name: 'par1',
    in: 'query',
    description: 'Description of par1',
    style: 'form',
    schema: {
      type: 'array',
      items: {
        type: 'string'
      }
    }
  },
  {
    input: 'fake.json'
  },
  {
    openapi: '',
    info: {
      title: 'fake open api',
      version: '3.0.0'
    },
    paths: []
  });

const parameter = new Parameter(
  {
    name: 'par1',
    in: 'query',
    description: 'Description of par1',
    schema: {
      type: 'array',
      items: {
        type: 'string'
      }
    }
  },
  {
    input: 'fake.json'
  },
  {
    openapi: '',
    info: {
      title: 'fake open api',
      version: '3.0.0'
    },
    paths: []
  });

describe('Parameters constructor', () => {
  it('paramter options should be serialized', () => {
    expect(parameterNotExploded.parameterOptions).toBe('{"style":"form","explode":false}');
    expect(parameterExploded.parameterOptions).toBe('{"style":"form","explode":true}');
    expect(parameter.parameterOptions).toBe('{}');
  });
});
