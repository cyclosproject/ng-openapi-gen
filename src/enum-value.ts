import jsesc from 'jsesc';
import { enumName } from './gen-utils';

/**
 * An enum value
 */
export class EnumValue {

  name: string;
  value: string;
  last = false;

  constructor(value: string) {
    this.name = enumName(value);
    this.value = `'${jsesc(value)}'`;
  }

}