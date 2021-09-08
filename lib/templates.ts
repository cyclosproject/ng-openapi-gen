import fs from 'fs';
import path from 'path';
import { Globals } from './globals';
import eol from 'eol';

/**
 * Holds all templates, and know how to apply them
 */
export class Templates {

  private templates: { [key: string]: HandlebarsTemplateDelegate } = {};
  private globals: { [key: string]: any } = {};

  constructor(builtInDir: string, customDir: string, handlebars: typeof Handlebars) {
    const builtInTemplates = fs.readdirSync(builtInDir);
    const customTemplates = customDir === '' ? [] : fs.readdirSync(customDir);
    // Read all built-in templates, but taking into account an override, if any
    for (const file of builtInTemplates) {
      const dir = customTemplates.includes(file) ? customDir : builtInDir;
      this.parseTemplate(dir, file, handlebars);
    }
    // Also read any custom templates which are not built-in
    for (const file of customTemplates) {
      this.parseTemplate(customDir, file, handlebars);
    }
  }

  private parseTemplate(dir: string, file: string, handlebars: typeof Handlebars) {
    const baseName = this.baseName(file);
    if (baseName) {
      const text = eol.auto(fs.readFileSync(path.join(dir, file), 'utf-8'));
      const compiled = handlebars.compile(text);
      this.templates[baseName] = compiled;
      handlebars.registerPartial(baseName, compiled);
    }
  }

  /**
   * Sets a global variable, that is, added to the model of all templates
   */
  setGlobals(globals: Globals) {
    for (const name of Object.keys(globals)) {
      const value = (globals as { [key: string]: any })[name];
      this.globals[name] = value;
    }
  }

  private baseName(file: string): string | null {
    if (!file.endsWith('.handlebars')) {
      return null;
    }
    return file.substring(0, file.length - '.handlebars'.length);
  }

  /**
   * Applies a template with a given model
   * @param templateName The template name (file without .handlebars extension)
   * @param model The model variables to be passed in to the template
   */
  apply(templateName: string, model?: { [key: string]: any }): string {
    const template = this.templates[templateName];
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }
    const actualModel: { [key: string]: any } = { ...this.globals, ...(model || {}) };
    return template(actualModel);
  }

}
