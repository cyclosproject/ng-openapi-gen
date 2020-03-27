export class Blob {
  type = 'application/json';
}

export class File extends Blob {
  name = 'file.json';
}

type FormDataEntryValue = File | string;

export interface HttpParameterCodec {
  encodeKey(key: string): string;
  encodeValue(value: string): string;
  decodeKey(key: string): string;
  decodeValue(value: string): string;
}

export interface HttpParamsOptions {
  encoder?: HttpParameterCodec;
}

abstract class ParamContainer<T> {
  private map = new Map<string, T[]>();

  constructor() {
  }

  has(param: string): boolean {
    return this.map.has(param);
  }

  get(param: string): T | null {
    const value = this.map.get(param);
    return value === undefined ? null : value[0];
  }

  getAll(param: string): T[] | null {
    const value = this.map.get(param);
    return value === undefined ? null : value;
  }

  keys(): string[] {
    return Array.from(this.map.keys());
  }

  append(param: string, value: T): this {
    if (!this.map.has(param)) {
      this.map.set(param, [value]);
    } else {
      this.map.set(param, [...(this.map.get(param) || []), value]);
    }
    return this;
  }
  set(param: string, value: T): this {
    this.map.set(param, [value]);
    return this;
  }

  delete(param: string, value?: T): this {
    if (value) {
      this.map.set(param, [...(this.map.get(param) || [])].filter(v => v !== value));
    } else {
      this.map.delete(param);
    }
    return this;
  }

  toString(): string {
    return this.map.toString();
  }
}

export class HttpParams extends ParamContainer<string> {
  constructor(_options?: HttpParamsOptions) {
    super();
  }
}

export class HttpHeaders extends ParamContainer<string> {
}

export class HttpRequest<_T> {
  constructor(public method: string, public url: string, public body: string, public options: {
    params?: HttpParams,
    headers?: HttpHeaders,
    responseType?: 'json' | 'text' | 'blob' | 'arraybuffer',
    reportProgress?: boolean
  }) {
  }
}

export class FormData extends ParamContainer<FormDataEntryValue> {
  forEach(callbackfn: (value: FormDataEntryValue, key: string, parent: FormData) => void, thisArg?: any): void {
    for (const key of this.keys()) {
      const value = this.get(key);
      if (value) {
        callbackfn.apply(thisArg || this, [value, key, this]);
      }
    }
  }
}
