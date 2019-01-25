import { Content } from './content';
import { Operation } from './operation';

/**
 * An operation has a variant per distinct possible body content
 */
export class OperationVariant {
  constructor(
    public operation: Operation,
    public methodName: string,
    public requestBody: Content | null,
    public successResponse: Content | null) {
  }
}
