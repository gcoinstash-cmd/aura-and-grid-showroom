/**
 * Unit #312: JSON Schema Type Validator Rig
 * Track 1 (Lean Tuner) — Zero-Dependency JSON Contract Validator
 * 
 * GhostFactoryOS Architecture: Cluster-007
 * Pure ESM | Zero External Dependencies (Node.js Standard Library Only)
 */

export class SchemaValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'SchemaValidationError';
    this.errors = errors;
  }
}

/**
 * Validates data against a lightweight JSON schema specification.
 * 
 * Supported Schema Properties:
 * - `type`: 'string'|'number'|'integer'|'boolean'|'array'|'object'|'null'
 * - `required`: Array of required property keys for objects
 * - `properties`: Sub-schemas for object properties
 * - `items`: Sub-schema for array elements
 * - `minimum`, `maximum`: Numeric bounds
 * - `minLength`, `maxLength`: String length bounds
 * - `pattern`: RegExp or string regex pattern
 * - `enum`: Array of allowed scalar values
 * 
 * @param {Object} schema 
 * @param {any} data 
 * @param {string} [currentPath='$'] 
 * @returns {{ valid: boolean, errors: Array<{ path: string, message: string, rule: string }> }}
 */
export function validateSchema(schema, data, currentPath = '$') {
  const errors = [];

  if (!schema || typeof schema !== 'object') {
    return { valid: true, errors: [] };
  }

  // 1. Type Check
  if (schema.type) {
    const expectedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    let actualType = typeof data;

    if (data === null) actualType = 'null';
    else if (Array.isArray(data)) actualType = 'array';
    else if (actualType === 'number' && Number.isInteger(data)) actualType = 'integer';

    const matchesType = expectedTypes.some(t => {
      if (t === 'number') return actualType === 'number' || actualType === 'integer';
      return t === actualType;
    });

    if (!matchesType) {
      errors.push({
        path: currentPath,
        message: `Expected type ${expectedTypes.join('|')}, got ${actualType}`,
        rule: 'type'
      });
      return { valid: false, errors };
    }
  }

  // If null or undefined and passed type check, skip further constraints
  if (data === null || data === undefined) {
    return { valid: errors.length === 0, errors };
  }

  // 2. Enum Check
  if (Array.isArray(schema.enum)) {
    if (!schema.enum.includes(data)) {
      errors.push({
        path: currentPath,
        message: `Value must be one of [${schema.enum.join(', ')}]`,
        rule: 'enum'
      });
    }
  }

  // 3. String Constraints
  if (typeof data === 'string') {
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push({
        path: currentPath,
        message: `String length ${data.length} is less than minimum ${schema.minLength}`,
        rule: 'minLength'
      });
    }
    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      errors.push({
        path: currentPath,
        message: `String length ${data.length} exceeds maximum ${schema.maxLength}`,
        rule: 'maxLength'
      });
    }
    if (schema.pattern) {
      const reg = schema.pattern instanceof RegExp ? schema.pattern : new RegExp(schema.pattern);
      if (!reg.test(data)) {
        errors.push({
          path: currentPath,
          message: `String does not match pattern ${schema.pattern}`,
          rule: 'pattern'
        });
      }
    }
  }

  // 4. Numeric Constraints
  if (typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push({
        path: currentPath,
        message: `Numeric value ${data} is less than minimum ${schema.minimum}`,
        rule: 'minimum'
      });
    }
    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push({
        path: currentPath,
        message: `Numeric value ${data} exceeds maximum ${schema.maximum}`,
        rule: 'maximum'
      });
    }
  }

  // 5. Array Constraints
  if (Array.isArray(data)) {
    if (schema.items) {
      for (let i = 0; i < data.length; i++) {
        const itemResult = validateSchema(schema.items, data[i], `${currentPath}[${i}]`);
        if (!itemResult.valid) {
          errors.push(...itemResult.errors);
        }
      }
    }
  }

  // 6. Object Constraints
  if (typeof data === 'object' && !Array.isArray(data)) {
    if (Array.isArray(schema.required)) {
      for (const reqKey of schema.required) {
        if (data[reqKey] === undefined) {
          errors.push({
            path: `${currentPath}.${reqKey}`,
            message: `Required property '${reqKey}' is missing`,
            rule: 'required'
          });
        }
      }
    }

    if (schema.properties) {
      for (const [propKey, propSchema] of Object.entries(schema.properties)) {
        if (data[propKey] !== undefined) {
          const propResult = validateSchema(propSchema, data[propKey], `${currentPath}.${propKey}`);
          if (!propResult.valid) {
            errors.push(...propResult.errors);
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Asserts that data conforms to the schema or throws SchemaValidationError.
 * @param {Object} schema 
 * @param {any} data 
 */
export function assertValid(schema, data) {
  const result = validateSchema(schema, data);
  if (!result.valid) {
    const detail = result.errors.map(e => `[${e.path}] ${e.message}`).join('; ');
    throw new SchemaValidationError(`JSON Schema validation failed: ${detail}`, result.errors);
  }
  return true;
}

/**
 * Performance benchmark.
 * @param {number} [iterations=2000] 
 */
export function benchmarkSchemaValidator(iterations = 2000) {
  const schema = {
    type: 'object',
    required: ['id', 'metric', 'value'],
    properties: {
      id: { type: 'string', minLength: 3 },
      metric: { type: 'string', enum: ['rpm', 'temp', 'psi'] },
      value: { type: 'number', minimum: 0, maximum: 10000 }
    }
  };
  const validData = { id: 'GF-312', metric: 'rpm', value: 4500 };

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    validateSchema(schema, validData);
  }
  const totalMs = performance.now() - start;

  return {
    iterations,
    totalMs: Number(totalMs.toFixed(3)),
    avgLatencyUs: Number(((totalMs * 1000) / iterations).toFixed(2)),
    opsPerSec: Math.round((iterations / totalMs) * 1000)
  };
}
