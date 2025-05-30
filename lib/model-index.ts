import { GenType } from './gen-type';
import { Model } from './model';
import { Options } from './options';

/**
 * Represents the model index
 */
export class ModelIndex extends GenType {

  constructor(models: Model[], options: Options) {
    super('models', n => n, options);
    models.forEach(model => this.addImport(model.name, !model.isEnumRef));
    this.updateImports();
  }

  protected skipImport(): boolean {
    return false;
  }

  protected initPathToRoot(): string {
    return './';
  }
}
