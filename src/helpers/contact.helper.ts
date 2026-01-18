/**
 * Detect contact type from contact string
 */
export function detectContactType(contact: string): 'email' | 'phone' | 'mobile' | 'unknown' {
  const trimmedContact = contact.trim().toLowerCase();

  // Email pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailPattern.test(trimmedContact)) {
    return 'email';
  }

  // Phone pattern (digits only, 10-15 digits)
  const phonePattern = /^\+?[1-9]\d{9,14}$/;
  const digitsOnly = trimmedContact.replace(/[\s\-()]/g, '');
  if (phonePattern.test(digitsOnly)) {
    // Check if it's mobile (starts with mobile indicators)
    const mobileIndicators = ['+1', '1', '91', '+91', '44', '+44'];
    const startsWithMobile = mobileIndicators.some((indicator) =>
      digitsOnly.startsWith(indicator)
    );
    return startsWithMobile ? 'mobile' : 'phone';
  }

  return 'unknown';
}

/**
 * Format contact based on type
 */
export function formatContact(contact: string, type: string): string {
  const trimmedContact = contact.trim().toLowerCase();
  const normalizedType = type.toLowerCase();

  // Handle primary email and primary_email variations
  if (normalizedType === 'email' || normalizedType === 'primary email' || normalizedType === 'primary_email') {
    return trimmedContact;
  }

  // Handle primary mobile, primary_mobile, phone, and mobile variations
  if (
    normalizedType === 'phone' ||
    normalizedType === 'mobile' ||
    normalizedType === 'primary mobile' ||
    normalizedType === 'primary_mobile'
  ) {
    // Remove all non-digit characters except +
    const digitsOnly = trimmedContact.replace(/[^\d+]/g, '');
    return digitsOnly;
  }

  return trimmedContact;
}

/**
 * Validate contact format based on type
 */
export function validateContactFormat(contact: string, type: string): {
  isValid: boolean;
  error?: string;
} {
  const trimmedContact = contact.trim();
  const normalizedType = type.toLowerCase();

  // Handle primary email and primary_email variations
  if (normalizedType === 'email' || normalizedType === 'primary email' || normalizedType === 'primary_email') {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(trimmedContact)) {
      return {
        isValid: false,
        error: 'Invalid email format',
      };
    }
    return { isValid: true };
  }

  // Handle primary mobile, primary_mobile, phone, and mobile variations
  if (
    normalizedType === 'phone' ||
    normalizedType === 'mobile' ||
    normalizedType === 'primary mobile' ||
    normalizedType === 'primary_mobile'
  ) {
    const digitsOnly = trimmedContact.replace(/[^\d+]/g, '');
    const phonePattern = /^\+?[1-9]\d{9,14}$/;
    if (!phonePattern.test(digitsOnly)) {
      return {
        isValid: false,
        error: 'Invalid phone number format. Must be 10-15 digits.',
      };
    }
    return { isValid: true };
  }

  return {
    isValid: false,
    error: `Unknown contact type: ${type}`,
  };
}
