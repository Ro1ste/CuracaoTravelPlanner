/**
 * Shared validation utilities for short codes and other common validations
 */

export interface ShortCodeValidationResult {
  isValid: boolean;
  error?: string;
  cleanedValue?: string;
}

/**
 * Validates and cleans a short code
 * @param shortCode - The short code to validate
 * @param isOptional - Whether the short code is optional (default: true)
 * @returns Validation result with cleaned value
 */
export function validateShortCode(shortCode: string | undefined | null, isOptional: boolean = true): ShortCodeValidationResult {
  // Handle empty values
  if (!shortCode) {
    if (isOptional) {
      return { isValid: true, cleanedValue: undefined };
    } else {
      return { isValid: false, error: "Short code is required" };
    }
  }

  // Trim whitespace
  const cleaned = shortCode.trim();

  // Check if empty after trimming
  if (!cleaned) {
    if (isOptional) {
      return { isValid: true, cleanedValue: undefined };
    } else {
      return { isValid: false, error: "Short code cannot be empty" };
    }
  }

  // Validate length
  if (cleaned.length < 3) {
    return { isValid: false, error: "Short code must be at least 3 characters long" };
  }

  if (cleaned.length > 50) {
    return { isValid: false, error: "Short code must be no more than 50 characters long" };
  }

  // Validate format - only allow letters, numbers, hyphens, and underscores
  if (!/^[a-zA-Z0-9_-]+$/.test(cleaned)) {
    return { isValid: false, error: "Short code can only contain letters, numbers, hyphens, and underscores" };
  }

  // Check for spaces (redundant with regex but explicit)
  if (cleaned.includes(" ")) {
    return { isValid: false, error: "Short code cannot contain spaces" };
  }

  // Check for consecutive special characters
  if (/[-_]{2,}/.test(cleaned)) {
    return { isValid: false, error: "Short code cannot have consecutive hyphens or underscores" };
  }

  // Check for starting/ending with special characters
  if (/^[-_]|[-_]$/.test(cleaned)) {
    return { isValid: false, error: "Short code cannot start or end with hyphens or underscores" };
  }

  return { isValid: true, cleanedValue: cleaned };
}

/**
 * Validates email format
 */
export function validateEmail(email: string): ShortCodeValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Invalid email format" };
  }
  return { isValid: true, cleanedValue: email.trim() };
}

/**
 * Validates that a string is not empty after trimming
 */
export function validateRequired(value: string | undefined | null, fieldName: string): ShortCodeValidationResult {
  if (!value || !value.trim()) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true, cleanedValue: value.trim() };
}
