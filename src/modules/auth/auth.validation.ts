import { z } from 'zod';
import { validateContactFormat } from '../../helpers/contact.helper';
import { validatePasswordStrength } from '../../utils/password.util';

/**
 * Contact validation schema
 */
export const contactSchema = z.object({
  contact_type: z.string().min(1, 'Contact type is required'),
  contact: z.string().min(1, 'Contact is required'),
}).refine(
  (data) => {
    const validation = validateContactFormat(data.contact, data.contact_type);
    return validation.isValid;
  },
  {
    message: 'Invalid contact format',
    path: ['contact'],
  }
);

/**
 * Register validation schema
 */
export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(100, 'Username must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9_.]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (password) => {
        const validation = validatePasswordStrength(password);
        return validation.isValid;
      },
      {
        message: 'Password does not meet strength requirements',
      }
    ),
  first_name: z.string().max(100, 'First name must not exceed 100 characters').optional().nullable(),
  last_name: z.string().max(100, 'Last name must not exceed 100 characters').optional().nullable(),
  contacts: z
    .array(contactSchema)
    .min(1, 'At least one contact is required')
    .refine(
      (contacts) => {
        // Ensure at least one email contact
        const hasEmail = contacts.some((c) => c.contact_type === 'email');
        return hasEmail;
      },
      {
        message: 'At least one email contact is required',
        path: ['contacts'],
      }
    ),
});

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  password: z.string().min(1, 'Password is required'),
  contact_type: z.string().optional(),
});

/**
 * Forgot password validation schema
 */
export const forgotPasswordSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  contact_type: z.string().optional(),
});

/**
 * Reset password validation schema
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (password) => {
        const validation = validatePasswordStrength(password);
        return validation.isValid;
      },
      {
        message: 'Password does not meet strength requirements',
      }
    ),
  user_id: z.string().uuid('Invalid user ID format'),
});

/**
 * Change password validation schema
 */
export const changePasswordSchema = z.object({
  old_password: z.string().min(1, 'Old password is required'),
  new_password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (password) => {
        const validation = validatePasswordStrength(password);
        return validation.isValid;
      },
      {
        message: 'Password does not meet strength requirements',
      }
    ),
});

/**
 * Verify contact validation schema
 */
export const verifyContactSchema = z.object({
  contact_id: z.string().uuid('Invalid contact ID format'),
  verification_code: z.string().min(1, 'Verification code is required'),
});

/**
 * Setup password validation schema (for first-time password setup)
 */
export const setupPasswordSchema = z.object({
  token: z.string().min(1, 'Setup token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .refine(
      (password) => {
        const validation = validatePasswordStrength(password);
        return validation.isValid;
      },
      {
        message: 'Password does not meet strength requirements',
      }
    ),
  confirm_password: z.string().min(1, 'Please confirm your password'),
  user_id: z.string().uuid('Invalid user ID format'),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

/**
 * Resend verification email validation schema
 */
export const resendVerificationSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
});