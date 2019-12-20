import jsesc from 'jsesc';
import { enumName } from './gen-utils';
import { Options } from './options';

/**
 * Represents a possible enumerated value
 */
export class EnumValue {
  name: string;
  value: string;

  constructor(public type: string, name: string | undefined, _value: any, public options: Options) {
    const value = String(_value);
    this.name = name || enumName(value, options);
    if (type === 'string') {
      this.value = `'${jsesc(value)}'`;
    } else {
      this.value = value;
    }
  }
}
