/**
 * Centralized OpenAPI type definitions and utilities for both OpenAPI 3.0 and 3.1 support
 */
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

// === Core OpenAPI Type Definitions ===
export type OpenAPIObject = OpenAPIV3.Document | OpenAPIV3_1.Document;
export type OperationObject = OpenAPIV3.OperationObject | OpenAPIV3_1.OperationObject;
export type PathsObject = OpenAPIV3.PathsObject | OpenAPIV3_1.PathsObject;
export type PathItemObject = OpenAPIV3.PathItemObject | OpenAPIV3_1.PathItemObject;
export type ReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject;
export type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;
export type ParameterObject = OpenAPIV3.ParameterObject | OpenAPIV3_1.ParameterObject;
export type RequestBodyObject = OpenAPIV3.RequestBodyObject | OpenAPIV3_1.RequestBodyObject;
export type ResponseObject = OpenAPIV3.ResponseObject | OpenAPIV3_1.ResponseObject;
export type MediaTypeObject = OpenAPIV3.MediaTypeObject | OpenAPIV3_1.MediaTypeObject;
export type SecuritySchemeObject = OpenAPIV3.SecuritySchemeObject | OpenAPIV3_1.SecuritySchemeObject;
export type SecurityRequirementObject = OpenAPIV3.SecurityRequirementObject | OpenAPIV3_1.SecurityRequirementObject;
export type TagObject = OpenAPIV3.TagObject | OpenAPIV3_1.TagObject;
export type ContentObject = {[media: string]: MediaTypeObject};
export type ArraySchemaObject = OpenAPIV3.ArraySchemaObject | OpenAPIV3_1.ArraySchemaObject;
export type ApiKeySecurityScheme = OpenAPIV3.ApiKeySecurityScheme | OpenAPIV3_1.ApiKeySecurityScheme;

// === Type Guard Functions ===
// These functions provide safe type checking for OpenAPI objects

/**
 * Type guard to check if an object is a ReferenceObject
 */
export function isReferenceObject(obj: any): obj is ReferenceObject {
  return obj && typeof obj === 'object' && '$ref' in obj;
}

/**
 * Type guard to check if a schema is an ArraySchemaObject
 */
export function isArraySchemaObject(obj: SchemaObject): obj is ArraySchemaObject {
  return 'type' in obj && obj.type === 'array' && 'items' in obj;
}

/**
 * Checks if a schema is nullable (compatible with both OpenAPI 3.0 and 3.1)
 * OpenAPI 3.0 uses 'nullable: true', OpenAPI 3.1 uses 'type: [T, "null"]'
 */
export function isNullable(schema: SchemaObject): boolean {
  // OpenAPI 3.0 style: nullable property
  if ('nullable' in schema && schema.nullable === true) {
    return true;
  }

  // OpenAPI 3.1 style: type array with "null"
  if ('type' in schema && Array.isArray(schema.type)) {
    return schema.type.includes('null' as any);
  }

  return false;
}

/**
 * Safely extracts the type from a schema object
 */
export function getSchemaType(schema: SchemaObject): string | string[] {
  if ('type' in schema && schema.type) {
    if (Array.isArray(schema.type)) {
      // OpenAPI 3.1 style - return all types for union handling
      return schema.type;
    }
    return schema.type;
  }
  // Return undefined for schemas without explicit type
  // This allows the caller to determine the appropriate default behavior
  return undefined as any;
}

// === Re-exported OpenAPI namespace types ===
// For cases where specific OpenAPI version types are needed
export { OpenAPIV3, OpenAPIV3_1 };
