import { ClassDeclaration, InterfaceDeclaration, TypescriptParser } from 'typescript-parser';
import { NgOpenApiGen } from '../lib/ng-openapi-gen';
import { OpenAPIObject } from '../lib/openapi-typings';
import options from './openapi31-webhooks.config.json';
import webhooksSpec from './openapi31-webhooks.json';
const spec = webhooksSpec as OpenAPIObject;

const gen = new NgOpenApiGen(spec, options);
gen.generate();

describe('OpenAPI 3.1 Webhooks Tests', () => {
  it('should generate User model with discriminator', () => {
    const model = gen.models.get('User');
    expect(model).toBeDefined();
    if (model) {
      const ts = gen.templates.apply('model', model);
      const parser = new TypescriptParser();
      parser.parseSource(ts).then(ast => {
        expect(ast.declarations.length).toBe(1);
        expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
        const decl = ast.declarations[0] as InterfaceDeclaration;
        expect(decl.name).toBe('User');

        // Check id property - should be string (uuid format)
        const idProp = decl.properties.find(p => p.name === 'id');
        expect(idProp).toBeDefined();
        expect(idProp?.type).toContain('string');

        // Check name property - should be string
        const nameProp = decl.properties.find(p => p.name === 'name');
        expect(nameProp).toBeDefined();
        expect(nameProp?.type).toContain('string');

        // Check userType property - should be enum
        const userTypeProp = decl.properties.find(p => p.name === 'userType');
        expect(userTypeProp).toBeDefined();
        expect(userTypeProp?.type).toContain('regular');
        expect(userTypeProp?.type).toContain('admin');
      });
    }
  });

  it('should generate WebhookPayload model with const and enum', () => {
    const model = gen.models.get('WebhookPayload');
    expect(model).toBeDefined();
    if (model) {
      const ts = gen.templates.apply('model', model);
      const parser = new TypescriptParser();
      parser.parseSource(ts).then(ast => {
        expect(ast.declarations.length).toBe(1);
        expect(ast.declarations[0]).toEqual(expect.any(InterfaceDeclaration));
        const decl = ast.declarations[0] as InterfaceDeclaration;
        expect(decl.name).toBe('WebhookPayload');

        // Check event property - should be enum
        const eventProp = decl.properties.find(p => p.name === 'event');
        expect(eventProp).toBeDefined();
        expect(eventProp?.type).toContain('user.created');
        expect(eventProp?.type).toContain('user.updated');
        expect(eventProp?.type).toContain('user.deleted');

        // Check version property - should be const literal
        const versionProp = decl.properties.find(p => p.name === 'version');
        expect(versionProp).toBeDefined();
        expect(versionProp?.type).toContain('1.0');

        // Check data property - should reference User
        const dataProp = decl.properties.find(p => p.name === 'data');
        expect(dataProp).toBeDefined();
        expect(dataProp?.type).toContain('User');
      });
    }
  });

  it('should generate API service with webhook operations', () => {
    const service = gen.services.get('Api');
    expect(service).toBeDefined();
    if (service) {
      const ts = gen.templates.apply('service', service);
      const parser = new TypescriptParser();
      parser.parseSource(ts).then(ast => {
        expect(ast.declarations.length).toBe(1);
        expect(ast.declarations[0]).toEqual(expect.any(ClassDeclaration));
        const cls = ast.declarations[0] as ClassDeclaration;

        // Should have createUser method
        const createUserMethod = cls.methods.find(m => m.name.includes('createUser'));
        expect(createUserMethod).toBeDefined();

        // Should have getWebhookPayload method
        const getWebhookPayloadMethod = cls.methods.find(m => m.name.includes('getWebhookPayload'));
        expect(getWebhookPayloadMethod).toBeDefined();
      });
    }
  });

  it('should handle webhooks specification without generating webhook services', () => {
    // Test that the generator doesn't fail when webhooks are present
    // Webhooks in OpenAPI 3.1 define callback operations but don't generate client services
    expect(gen.models.size).toBeGreaterThan(0);
    expect(gen.services.size).toBeGreaterThan(0);

    // Verify the spec contains webhooks
    expect((spec as any).webhooks).toBeDefined();
    expect((spec as any).webhooks.userCreated).toBeDefined();
    expect((spec as any).webhooks.userUpdated).toBeDefined();
  });
});
