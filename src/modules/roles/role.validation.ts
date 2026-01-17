import { z } from 'zod';

/**
 * Create role validation schema
 */
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Role name can only contain letters, numbers, and underscores'),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional().nullable(),
});

/**
 * Update role validation schema
 */
export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(100, 'Role name must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Role name can only contain letters, numbers, and underscores')
    .optional(),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional().nullable(),
  is_active: z.boolean().optional(),
});

/**
 * Assign permissions validation schema
 */
export const assignPermissionsSchema = z.object({
  permission_ids: z
    .array(z.string().uuid('Invalid permission ID'))
    .min(1, 'At least one permission ID is required'),
});

/**
 * Remove permissions validation schema
 */
export const removePermissionsSchema = z.object({
  permission_ids: z
    .array(z.string().uuid('Invalid permission ID'))
    .min(1, 'At least one permission ID is required'),
});

/**
 * Get roles query validation schema
 */
export const getRolesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  name: z.string().optional(),
  is_active: z.coerce.boolean().optional(),
  sort_field: z.enum(['name', 'created_at', 'updated_at', 'is_active']).optional(),
  sort_order: z.enum(['ASC', 'DESC']).optional(),
});
