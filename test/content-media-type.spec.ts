import { InterfaceDeclaration, TypescriptParser } from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { OpenAPIObject } from '../lib/openapi-typings';
import options from './content-media-type.config.json';
import contentMediaTypeSpec from './content-media-type.json';

const spec = contentMediaTypeSpec as unknown as OpenAPIObject;

describe('Generation tests using content-media-type.json', () => {
  let gen: NgOpenApiGen;

  beforeEach(() => {
    gen = new NgOpenApiGen(spec, options);
    gen.generate();
  });

  it('UploadForm', async () => {
    const model = gen.models.get('UploadForm');
    expect(model).toBeDefined();
    if (!model) return;
    const ts = gen.templates.apply('model', model);
    const parser = new TypescriptParser();
    const ast = await parser.parseSource(ts);
    expect(ast.declarations.length).toBe(1);
    expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
    const decl = ast.declarations[0] as InterfaceDeclaration;
    const type = (name: string) => decl.properties.find(p => p.name === name)?.type;

    // Raw binary content is a Blob
    expect(type('file')).toBe('Blob');
    expect(type('image')).toBe('Blob');
    expect(type('optionalFile')).toBe('(Blob | null)');
    // Encoded binary content is carried as a string
    expect(type('encoded')).toBe('string');
    // Textual content is a string
    expect(type('jsonText')).toBe('string');
    expect(type('plainText')).toBe('string');
  });

  it('PUT /raw', () => {
    const operation = gen.operations.get('putRaw');
    expect(operation).toBeDefined();
    if (!operation) return;
    expect(operation.variants[0].requestBody?.type).toBe('Blob');
  });

  it('GET /download', () => {
    const operation = gen.operations.get('download');
    expect(operation).toBeDefined();
    if (!operation) return;
    const variant = operation.variants[0];
    expect(variant.successResponse?.type).toBe('Blob');
    expect(variant.responseType).toBe('blob');
  });

  it('GET /encoded', () => {
    const operation = gen.operations.get('encoded');
    expect(operation).toBeDefined();
    if (!operation) return;
    const variant = operation.variants[0];
    expect(variant.successResponse?.type).toBe('string');
    expect(variant.responseType).toBe('json');
  });
});
