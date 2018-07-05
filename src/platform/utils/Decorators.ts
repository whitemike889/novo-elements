export interface IDeprecatedOptions {
  // Optionally specify a custom message
  message?: string;
  // Optionally indicate that an alternate method to the obsolete one exists
  alternateMethod?: string;
  version?: string;
  targetVersion?: string;
}

/**
 * Obsolete decorator for marking methods obsolete, you can optionally specify a custom message and/or alternate replacement
 * method do the deprecated one. I
 */
export function Deprecated(options?: IDeprecatedOptions) {
  options = Object.assign(
    {},
    { message: 'This method will be removed in future versions of Novo Elements.', alternateMethod: null },
    options,
  );

  return function(target: any, property: string, descriptor: PropertyDescriptor): any {
    if (!(typeof descriptor.value === 'function' || typeof descriptor.get === 'function' || typeof descriptor.set === 'function')) {
      throw new SyntaxError('Only functions/getters/setters can be marked as obsolete');
    }
    const methodSignature = `${target.name || ''}${target.name ? '.' : ''}${property}`;

    let message =
      `${methodSignature} is marked obsolete: ${options.message}` +
      (options.alternateMethod ? ` Use ${options.alternateMethod} instead` : '');

    let method = Object.assign({}, descriptor);

    if (descriptor.value) {
      method.value = function() {
        console.warn(message);
        return descriptor.value.apply(this, arguments);
      };
      return method;
    }

    if (descriptor.get) {
      method.get = function() {
        console.warn(message);
        return descriptor.get.apply(this, arguments);
      };
    }

    if (descriptor.set) {
      method.set = function() {
        console.warn(message);
        return descriptor.set.apply(this, arguments);
      };
    }
    return method;
  };
}
