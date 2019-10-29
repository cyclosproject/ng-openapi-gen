export class Logger {
  constructor(public silent = false) { }

  info(message: string, ...optionalParams: []) {
    if (!this.silent) {
      console.info(message, ...optionalParams);
    }
  }

  log(message: string, ...optionalParams: []) {
    if (!this.silent) {
      console.log(message, ...optionalParams);
    }
  }

  debug(message: string, ...optionalParams: []) {
    if (!this.silent) {
      console.debug(message, ...optionalParams);
    }
  }

  warn(message: string, ...optionalParams: []) {
    console.warn(message, ...optionalParams);
  }

  error(message: string, ...optionalParams: []) {
    console.error(message, ...optionalParams);
  }
}
