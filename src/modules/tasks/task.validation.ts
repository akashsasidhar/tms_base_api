import { z } from 'zod';

/**
 * Create task validation schema
 */
export const createTaskSchema = z.object({
  project_id: z.string().uuid('Invalid project ID'),
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(255, 'Task title must not exceed 255 characters'),
  task_type: z.string().min(1, 'Task type is required'),
  description: z.string().max(5000, 'Description must not exceed 5000 characters').optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().default('MEDIUM'),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).default('TODO'),
  started_date: z.coerce.date({ required_error: 'Start date is required' }),
  due_date: z.coerce.date({ required_error: 'Due date is required' }),
  input_file_url: z.string().url('Invalid URL format').max(500, 'URL must not exceed 500 characters').optional().nullable(),
  output_file_url: z.string().url('Invalid URL format').max(500, 'URL must not exceed 500 characters').optional().nullable(),
  assignee_ids: z.array(z.string().uuid('Invalid assignee ID')).optional(),
}).refine(
  (data) => {
    // If both dates are provided, due_date should be after started_date
    if (data.started_date && data.due_date) {
      return data.due_date >= data.started_date;
    }
    return true;
  },
  {
    message: 'Due date must be after start date',
    path: ['due_date'],
  }
);

/**
 * Update task validation schema
 */
export const updateTaskSchema = z.object({
  project_id: z.string().uuid('Invalid project ID').optional(),
  title: z
    .string()
    .min(1, 'Task title is required')
    .max(255, 'Task title must not exceed 255 characters')
    .optional(),
  task_type: z.string().min(1, 'Task type is required').optional(),
  description: z.string().max(5000, 'Description must not exceed 5000 characters').optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  started_date: z.coerce.date().optional().nullable(),
  due_date: z.coerce.date().optional().nullable(),
  input_file_url: z.string().url('Invalid URL format').max(500, 'URL must not exceed 500 characters').optional().nullable(),
  output_file_url: z.string().url('Invalid URL format').max(500, 'URL must not exceed 500 characters').optional().nullable(),
  is_active: z.boolean().optional(),
  assignee_ids: z.array(z.string().uuid('Invalid assignee ID')).optional(),
}).refine(
  (data) => {
    // If both dates are provided, due_date should be after started_date
    if (data.started_date && data.due_date) {
      return data.due_date >= data.started_date;
    }
    return true;
  },
  {
    message: 'Due date must be after start date',
    path: ['due_date'],
  }
);

/**
 * Assignee update task validation schema (limited fields)
 */
export const assigneeUpdateTaskSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  output_file_url: z
    .string()
    .max(500, 'URL must not exceed 500 characters')
    .refine(
      (val) => {
        if (!val || val.trim() === '') return true; // Allow empty string
        return /^https?:\/\/.+/.test(val); // Validate URL format if provided
      },
      { message: 'Invalid URL format' }
    )
    .optional()
    .nullable(),
  comment: z.string().max(5000, 'Comment must not exceed 5000 characters').optional().nullable(),
});

/**
 * Get tasks query validation schema
 */
export const getTasksQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
  search: z.string().optional(),
  project_id: z.string().uuid('Invalid project ID').optional(),
  title: z.string().optional(),
  task_type: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']).optional(),
  created_by: z.string().uuid('Invalid created_by ID').optional(),
  assigned_to: z.string().uuid('Invalid assigned_to ID').optional(),
  is_active: z.coerce.boolean().optional(),
  due_date_from: z.coerce.date().optional(),
  due_date_to: z.coerce.date().optional(),
  list_type: z.enum(['active', 'pending', 'completed']).optional(),
  sort_field: z.enum(['title', 'created_at', 'due_date', 'priority', 'status']).optional(),
  sort_order: z.enum(['ASC', 'DESC']).default('ASC').optional(),
});
