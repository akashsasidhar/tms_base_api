import { z } from 'zod';
import { validatePasswordStrength } from '../../utils/password.util';
// validateContactFormat is not used in this file

/**
 * Contact validation schema
 */
const contactSchema = z.object({
  contact_type_id: z.string().uuid('Invalid contact type ID'),
  contact: z.string().min(1, 'Contact is required'),
});

/**
 * Create user validation schema
 * Password is optional - will use default password from config
 */
export const createUserSchema = z.object({
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
    )
    .optional(), // Password is optional - default password will be used
  first_name: z.string().max(100, 'First name must not exceed 100 characters').optional().nullable(),
  last_name: z.string().max(100, 'Last name must not exceed 100 characters').optional().nullable(),
  contacts: z
    .array(contactSchema)
    .min(1, 'At least one contact is required')
    .refine(
      (contacts) => {
        // Check for duplicate contacts
        const contactValues = contacts.map((c) => c?.contact?.toLowerCase());
        const uniqueContacts = new Set(contactValues);
        return uniqueContacts.size === contactValues.length;
      },
      {
        message: 'Duplicate contacts are not allowed',
      }
    ),
  role_ids: z
    .array(z.string().uuid('Invalid role ID'))
    .max(1, 'Users can only have one role at a time')
    .optional(),
});

/**
 * Update user validation schema
 */
export const updateUserSchema = z.object({
  first_name: z.string().max(100, 'First name must not exceed 100 characters').optional().nullable(),
  last_name: z.string().max(100, 'Last name must not exceed 100 characters').optional().nullable(),
  is_active: z.boolean().optional(),
});

/**
 * Add contact validation schema
 */
export const addContactSchema = z.object({
  contact_type_id: z.string().uuid('Invalid contact type ID'),
  contact: z.string().min(1, 'Contact is required'),
});

/**
 * Update contact validation schema
 */
export const updateContactSchema = z.object({
  contact: z.string().min(1, 'Contact is required').optional(),
});

/**
 * Assign role validation schema
 */
export const assignRoleSchema = z.object({
  role_id: z.string().uuid('Invalid role ID'),
  description: z.string().optional().nullable(),
});

/**
 * Change password validation schema
 */
export const changeUserPasswordSchema = z.object({
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
 * Get users query validation schema (filters, pagination, sort)
 */
export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  username: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  role_id: z.string().uuid('Invalid role ID').optional(),
  is_active: z.coerce.boolean().optional(),
  contact: z.string().optional(),
  sort_field: z.enum(['username', 'first_name', 'last_name', 'created_at', 'updated_at', 'is_active']).optional(),
  sort_order: z.enum(['ASC', 'DESC']).optional(),
});
