import { OpenAPIObject, OperationObject, PathItemObject } from '@loopback/openapi-v3-types';
import $RefParser from 'json-schema-ref-parser';
import path from 'path';
import { HTTP_METHODS } from './gen-utils';
import { Globals } from './globals';
import { Model } from './model';
import { Operation } from './operation';
import { Options } from './options';
import { Service } from './service';
import { Templates } from './templates';


/**
 * Main generator class
 */
export class NgOpenApiGen {

  openApi: OpenAPIObject;
  prefix: string;
  templates: Templates;
  models = new Map<string, Model>();
  services = new Map<string, Service>();

  constructor(public options: Options) {
  }

  async generate() {
    const refParser = new $RefParser();
    const input = this.options.input;
    try {
      this.openApi = await refParser.bundle(input, { dereference: { circular: false } }) as OpenAPIObject;
      this.doGenerate();
    } catch (err) {
      console.error(`Error on generation from ${input}: ${err}`);
    }
  }

  private doGenerate(): void {
    this.prefix = this.options.prefix || 'Api';
    this.readTemplates();
    this.readModels();
    this.readServices();

    // Ignore the unused models if not set to false in options
    if (this.options.ignoreUnusedModels !== false) {
      this.ignoreUnusedModels();
    }

    // Generate each model
    for (const model of this.models.values()) {
      this.templates.write('model', model, model.fileName);
    }

    // Generate each service
    for (const service of this.services.values()) {
      this.templates.write('service', service, service.fileName);
    }
  }

  private readTemplates() {
    const builtInDir = path.join(__dirname, 'templates');
    const customDir = this.options.templates || '';
    const globals = new Globals(this.options);
    this.templates = new Templates(builtInDir, customDir);
    this.templates.setGlobals(globals);
  }

  private readModels() {
    const schemas = (this.openApi.components || {}).schemas || {};
    for (const name of Object.keys(schemas)) {
      const schema = schemas[name];
      const model = new Model(name, schema, this.options);
      this.models.set(name, model);
    }
  }

  private readServices() {
    const defaultTag = this.options.defaultTag || this.prefix;

    // First read all operations, as tags are by operation
    const operationsByTag = new Map<string, Operation[]>();
    for (const path of Object.keys(this.openApi.paths)) {
      const pathSpec = this.openApi.paths[path] as PathItemObject;
      for (const method of HTTP_METHODS) {
        const methodSpec = pathSpec[method] as OperationObject;
        if (methodSpec) {
          const operation = new Operation(this.openApi, path, pathSpec, method, methodSpec, this.options);
          // Set a default tag if no tags are found
          if (operation.tags.length === 0) {
            console.warn(`No tags set on operation '${path}.${method}'. Assuming '${defaultTag}'.`);
            operation.tags.push(defaultTag);
          }
          for (const tag of operation.tags) {
            let operations = operationsByTag.get(tag);
            if (!operations) {
              operations = [];
              operationsByTag.set(tag, operations);
            }
            operations.push(operation);
          }
        }
      }
    }

    // Then create a service per operation, as long as the tag is included
    const includeTags = this.options.includeTags || [];
    const excludeTags = this.options.excludeTags || [];
    const tags = this.openApi.tags || [];
    for (const tagName of operationsByTag.keys()) {
      if (includeTags.length > 0 && !includeTags.includes(tagName)) {
        console.info(`Ignoring tag ${tagName} because it is not listed in the 'includeTags' option`);
        continue;
      }
      if (excludeTags.length > 0 && excludeTags.includes(tagName)) {
        console.info(`Ignoring tag ${tagName} because it is listed in the 'excludeTags' option`);
        continue;
      }
      const operations = operationsByTag.get(tagName) || [];
      const tag = tags.find(t => t.name === tagName) || { name: tagName };
      const service = new Service(tag, operations, this.options);
      this.services.set(tagName, service);
    }
  }

  private ignoreUnusedModels() {
    // First, collect all type names used by services
    const usedModels = new Set<string>();
    for (const service of this.services.values()) {
      for (const imp of service.imports) {
        usedModels.add(imp.type);
      }
    }
    // Then delete all models that are not imported
    for (const model of this.models.values()) {
      if (!usedModels.has(model.typeName)) {
        this.models.delete(model.name);
      }
    }
  }
}