import { EnumValue } from './enum-value';

/**
 * Represents a enum object
 */
export class Enum {
  name: string;
  propName: string;
  values: EnumValue[];

  constructor(propName: string, modelName: string, values: EnumValue[]) {
    this.propName = propName;
    this.name = modelName + this.capitalize(propName + 'Enum');
    this.values = values;
  }

  private capitalize(str: string): string {
    return str[0].toUpperCase() + str.slice(1);
  }
}
