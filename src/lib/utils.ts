import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function mapSnakeToCamel<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.entries(obj).reduce((result, [key, value]) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
    return result;
  }, {} as Record<string, unknown>);
}

export function mapCamelToSnake<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.entries(obj).reduce((result, [key, value]) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = value;
    return result;
  }, {} as Record<string, unknown>);
}

export function isDuplicateDbError(error: any): boolean {
  if (!error) return false;
  const text = String(error?.message || error?.error?.message || error?.details || '');
  return /duplicate key|unique constraint|already exists|duplicate entry|23505/i.test(text);
}
