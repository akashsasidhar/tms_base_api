import { z } from 'zod';

/**
 * Create project validation schema
 */
export const createProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(255, 'Project name must not exceed 255 characters'),
  description: z.string().max(5000, 'Description must not exceed 5000 characters').optional().nullable(),
  project_manager_id: z.string().uuid('Invalid project manager ID').optional().nullable(),
  start_date: z.coerce.date().optional().nullable(),
  end_date: z.coerce.date().optional().nullable(),
}).refine(
  (data) => {
    // If both dates are provided, end_date should be after start_date
    if (data.start_date && data.end_date) {
      return data.end_date >= data.start_date;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['end_date'],
  }
);

/**
 * Update project validation schema
 */
export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(1, 'Project name is required')
    .max(255, 'Project name must not exceed 255 characters')
    .optional(),
  description: z.string().max(5000, 'Description must not exceed 5000 characters').optional().nullable(),
  project_manager_id: z.string().uuid('Invalid project manager ID').optional().nullable(),
  start_date: z.coerce.date().optional().nullable(),
  end_date: z.coerce.date().optional().nullable(),
  is_active: z.boolean().optional(),
}).refine(
  (data) => {
    // If both dates are provided, end_date should be after start_date
    if (data.start_date && data.end_date) {
      return data.end_date >= data.start_date;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['end_date'],
  }
);

/**
 * Get projects query validation schema
 */
export const getProjectsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(10).optional(),
  search: z.string().optional(),
  name: z.string().optional(),
  created_by: z.string().uuid('Invalid created_by ID').optional(),
  is_active: z.coerce.boolean().optional(),
  start_date_from: z.coerce.date().optional(),
  start_date_to: z.coerce.date().optional(),
  end_date_from: z.coerce.date().optional(),
  end_date_to: z.coerce.date().optional(),
  sort_field: z.enum(['name', 'created_at', 'start_date', 'end_date']).optional(),
  sort_order: z.enum(['ASC', 'DESC']).default('ASC').optional(),
});
