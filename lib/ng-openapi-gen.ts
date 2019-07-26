import { OpenAPIObject, OperationObject, PathItemObject, ReferenceObject, SchemaObject } from '@loopback/openapi-v3-types';
import fs from 'fs-extra';
import path from 'path';
import { HTTP_METHODS, methodName, simpleName, modelClass } from './gen-utils';
import { Globals } from './globals';
import { Model } from './model';
import { Operation } from './operation';
import { Options } from './options';
import { Service } from './service';
import { Templates } from './templates';
import { parseOptions } from './cmd-args';
import $RefParser from 'json-schema-ref-parser';
import mkdirp from 'mkdirp';

/**
 * Main generator class
 */
export class NgOpenApiGen {
  globals: Globals;
  templates: Templates;
  models = new Map<string, Model>();
  services = new Map<string, Service>();
  operations = new Map<string, Operation>();
  outDir: string;

  constructor(
    public openApi: OpenAPIObject,
    public options: Options) {

    this.outDir = this.options.output || 'src/app/api';

    this.readTemplates();
    this.readModels();
    this.readServices();

    // Ignore the unused models if not set to false in options
    if (this.options.ignoreUnusedModels !== false) {
      this.ignoreUnusedModels();
    }
  }

  /**
   * Actually generates the files
   */
  generate(): void {
    if (this.options.removeStaleFiles !== false) {
      // Clear the output directory
      fs.emptyDirSync(this.outDir);
    }

    // Generate each model
    const models = [...this.models.values()];
    for (const model of models) {
      this.write('model', model, model.fileName, 'models');
    }

    // Generate each service
    const services = [...this.services.values()];
    for (const service of services) {
      this.write('service', service, service.fileName, 'services');
    }

    // Context object passed to general templates
    const general = {
      services: services,
      models: models
    };

    // Generate the general files
    this.write('configuration', general, this.globals.configurationFile);
    this.write('response', general, this.globals.responseFile);
    this.write('requestBuilder', general, this.globals.requestBuilderFile);
    this.write('baseService', general, this.globals.baseServiceFile);
    if (this.globals.moduleClass && this.globals.moduleFile) {
      this.write('module', general, this.globals.moduleFile);
    }
    if (this.globals.modelIndexFile) {
      this.write('modelIndex', general, this.globals.modelIndexFile);
    }
    if (this.globals.serviceIndexFile) {
      this.write('serviceIndex', general, this.globals.serviceIndexFile);
    }
    console.info(`Generation from ${this.options.input} finished with ${models.length} models and ${services.length} services.`);
  }

  private write(template: string, model: any, baseName: string, subDir?: string) {
    const ts = this.templates.apply(template, model);
    const file = path.join(this.outDir, subDir || '.', `${baseName}.ts`);
    const dir = path.dirname(file);
    mkdirp.sync(dir);
    fs.writeFileSync(file, ts, { encoding: 'utf-8' });
    console.info(`Wrote ${file}`);
  }

  private readTemplates() {
    const hasLib = __dirname.endsWith(path.sep + 'lib');
    const builtInDir = path.join(__dirname, hasLib ? '../templates' : 'templates');
    const customDir = this.options.templates || '';
    this.globals = new Globals(this.options);
    this.templates = new Templates(builtInDir, customDir);
    this.templates.setGlobals(this.globals);
  }

  private readModels() {
    const schemas = (this.openApi.components || {}).schemas || {};
    for (const name of Object.keys(schemas)) {
      const schema = schemas[name];
      const clazz = modelClass(name, this.options);
      const model = new Model(clazz, schema, this.options);
      this.models.set(clazz, model);
    }
  }

  private readServices() {
    const defaultTag = this.options.defaultTag || 'Api';

    // First read all operations, as tags are by operation
    const operationsByTag = new Map<string, Operation[]>();
    for (const opPath of Object.keys(this.openApi.paths)) {
      const pathSpec = this.openApi.paths[opPath] as PathItemObject;
      for (const method of HTTP_METHODS) {
        const methodSpec = pathSpec[method] as OperationObject;
        if (methodSpec) {
          let id = methodSpec.operationId;
          if (id) {
            // Make sure the id is valid
            id = methodName(id);
          } else {
            // Generate an id
            id = methodName(`${opPath}.${method}`);
            console.warn(`Operation '${opPath}.${method}' didn't specify an 'operationId'. Assuming '${id}'.`);
          }
          if (this.operations.has(id)) {
            // Duplicated id. Add a suffix
            let suffix = 0;
            let newId = id;
            while (this.operations.has(newId)) {
              newId = `${id}_${++suffix}`;
            }
            console.warn(`Duplicate operation id '${id}'. Assuming id ${newId} for operation '${opPath}.${method}'.`);
            id = newId;
          }

          const operation = new Operation(this.openApi, opPath, pathSpec, method, id, methodSpec, this.options);
          // Set a default tag if no tags are found
          if (operation.tags.length === 0) {
            console.warn(`No tags set on operation '${opPath}.${method}'. Assuming '${defaultTag}'.`);
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

          // Store the operation
          this.operations.set(id, operation);
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
      this.services.set(service.typeName, service);
    }
  }

  private ignoreUnusedModels() {
    // First, collect all type names used by services
    const usedNames = new Set<string>();
    for (const service of this.services.values()) {
      for (const imp of service.imports) {
        usedNames.add(imp.type);
      }
      for (const imp of service.additionalDependencies) {
        usedNames.add(imp);
      }
    }

    // Collect dependencies on models themselves
    const referencedModels = Array.from(usedNames);
    usedNames.clear();
    referencedModels.forEach(name => this.collectDependencies(name, usedNames));

    // Then delete all unused models
    for (const model of this.models.values()) {
      if (!usedNames.has(model.typeName)) {
        console.debug(`Ignoring model ${model.name} because it is not used anywhere`);
        this.models.delete(model.name);
      }
    }
  }

  private collectDependencies(name: string, usedNames: Set<string>) {
    const model = this.models.get(name);
    if (!model || usedNames.has(model.name)) {
      return;
    }

    // Add the model name itself
    usedNames.add(model.name);
    // Then find all referenced names and recurse
    this.allReferencedNames(model.schema).forEach(n => this.collectDependencies(n, usedNames));
  }

  private allReferencedNames(schema: SchemaObject | ReferenceObject | undefined): string[] {
    if (!schema) {
      return [];
    }
    if (schema.$ref) {
      return [modelClass(simpleName(schema.$ref), this.options)];
    }
    schema = schema as SchemaObject;
    const result: string[] = [];
    (schema.allOf || []).forEach(s => Array.prototype.push.apply(result, this.allReferencedNames(s)));
    (schema.anyOf || []).forEach(s => Array.prototype.push.apply(result, this.allReferencedNames(s)));
    (schema.oneOf || []).forEach(s => Array.prototype.push.apply(result, this.allReferencedNames(s)));
    if (schema.properties) {
      for (const prop of Object.keys(schema.properties)) {
        Array.prototype.push.apply(result, this.allReferencedNames(schema.properties[prop]));
      }
    }
    if (typeof schema.additionalProperties === 'object') {
      Array.prototype.push.apply(result, this.allReferencedNames(schema.additionalProperties));
    }
    if (schema.items) {
      Array.prototype.push.apply(result, this.allReferencedNames(schema.items));
    }
    return result;
  }
}

///////////////////////////////////////////////////////////////////////////

/**
 * Parses the command-line arguments, reads the configuration file and run the generation
 */
export async function runNgOpenApiGen() {
  const options = parseOptions();
  const refParser = new $RefParser();
  const input = options.input;
  try {
    const openApi = await refParser.bundle(input, { dereference: { circular: false } }) as OpenAPIObject;
    const gen = new NgOpenApiGen(openApi, options);
    gen.generate();
  } catch (err) {
    console.error(`Error on API generation from ${input}: ${err}`);
  }
}
