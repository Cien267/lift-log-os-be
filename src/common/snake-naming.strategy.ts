import { DefaultNamingStrategy } from 'typeorm';

export class SnakeNamingStrategy extends DefaultNamingStrategy {
  columnName(
    propertyName: string,
    customName: string | undefined,
    embeddedPrefixes: string[],
  ): string {
    return customName ?? toSnakeCase(propertyName);
  }
}

function toSnakeCase(value: string): string {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}
