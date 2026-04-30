import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function isDuplicateDbError(error: any): boolean {
  if (!error) return false;
  const text = String(error?.message || error?.error?.message || error?.details || '');
  return /duplicate key|unique constraint|already exists|duplicate entry|23505/i.test(text);
}
