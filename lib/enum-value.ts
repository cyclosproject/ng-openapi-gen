import jsesc from 'jsesc';
import { enumName } from './gen-utils';
import { Options } from './options';

/**
 * Represents a possible enumerated value
 */
export class EnumValue {
  name: string;
  value: string;
  description: string;

  constructor(public type: string, name: string | undefined, description: string | undefined, _value: any, public options: Options) {
    const value = String(_value);
    this.name = name || enumName(value, options);
    this.description = description || this.name;
    if (this.name === '') {
      this.name = '_';
    }
    if (this.description === '') {
      this.description = this.name;
    }
    if (type === 'string') {
      this.value = `'${jsesc(value)}'`;
    } else {
      this.value = value;
    }
  }
}
