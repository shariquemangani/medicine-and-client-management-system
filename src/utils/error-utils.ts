/**
 * Extracts error message from various API response formats
 * @param error - The error object from API response
 * @param fallbackMessage - Default message to show if no error message can be extracted
 * @returns Extracted error message as string
 */
export const extractErrorMessage = (
  error: any,
  fallbackMessage: string = 'An error occurred'
): string => {
  if (!error) return fallbackMessage;

  // Case 1: Direct message property
  if (typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  // Case 2: Nested message in data property
  if (
    typeof error === 'object' && 
    'data' in error && 
    error.data && 
    typeof error.data === 'object' && 
    'message' in error.data
  ) {
    return String(error.data.message);
  }

  // Case 3: Special case for duplicate recipe name error
  if (
    typeof error === 'object' && 
    'error' in error && 
    error.error === 'DUPLICATE_RECIPE_NAME' && 
    error.details?.length > 0
  ) {
    return String(error.details[0].message);
  }

  // Case 4: Direct string error
  if (typeof error === 'string') {
    return error;
  }

  // Default fallback
  return fallbackMessage;
};
