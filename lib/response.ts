import { Content } from './content';
import { Options } from './options';

/**
 * An operation response
 */
export class Response {
  constructor(
    public statusCode: string,
    public description: string,
    public content: Content[],
    public options: Options) {
  }
}
