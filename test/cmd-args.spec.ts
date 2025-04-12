import { parseOptions } from '../lib/cmd-args';

describe('cmd-args.ts', () => {

  describe('#parseOptions', () => {

    it('should options contain customizedResponseType as an object if customizedResponseType is given in cmd args', () => {
      const sysArgs = ['--input', 'abc', '--customizedResponseType', '{}'];
      const options = parseOptions(sysArgs);
      expect(options.customizedResponseType).toEqual({});
    });

    it('should options contain customizedResponseType as an object if customizedResponseType is given in config file', () => {
      const sysArgs = ['--input', 'abc', '--config', 'test/cmd-args-test-config.json'];
      const options = parseOptions(sysArgs);
      expect(options.customizedResponseType).toEqual({
        'abc': {
          'toUse': 'arraybuffer'
        }
      });
    });

    it('should customizedResponseType be overrided by cmd\'s if both config and args contains customizedResponseType', () => {
      const sysArgs = ['--input', 'abc', '--customizedResponseType', '{}', '--config', 'test/cmd-args-test-config.json'];
      const options = parseOptions(sysArgs);
      expect(options.customizedResponseType).toEqual({});
    });

    it('should customizedResponseType be overrided by cmd\'s if both config and args contains customizedResponseType', () => {
      const sysArgs = [
        '--input',
        'abc',
        '--customizedResponseType',
        '{}',
        '--config',
        'test/cmd-args-test-config.json',
        '--experimental',
        'true',
      ];
      const options = parseOptions(sysArgs);
      expect(options.experimental).toEqual(true);
    });
  });

});
