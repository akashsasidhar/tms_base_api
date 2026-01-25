/**
 * Task DTOs and Types
 */

export interface CreateTaskDto {
  project_id: string;
  title: string;
  task_type: string;
  description?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  started_date?: Date | null;
  due_date?: Date | null;
  input_file_url?: string | null;
  output_file_url?: string | null;
  assignee_ids?: string[]; // Array of user IDs to assign the task to
}

export interface UpdateTaskDto {
  project_id?: string;
  title?: string;
  task_type?: string;
  description?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  started_date?: Date | null;
  due_date?: Date | null;
  input_file_url?: string | null;
  output_file_url?: string | null;
  is_active?: boolean;
  assignee_ids?: string[]; // Array of user IDs to assign the task to
}

export interface TaskResponseDto {
  id: string;
  project_id: string;
  title: string;
  task_type: string;
  description: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  created_by: string;
  started_date: Date | null;
  due_date: Date | null;
  input_file_url: string | null;
  output_file_url: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  project?: {
    id: string;
    name: string;
  } | null;
  creator?: {
    id: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  assignees?: Array<{
    id: string;
    user_id: string;
    assigned_by: string;
    assigned_at: Date;
    user?: {
      id: string;
      username: string;
      first_name: string | null;
      last_name: string | null;
    } | null;
  }> | null;
}

export interface TaskFilters {
  project_id?: string;
  title?: string;
  task_type?: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  created_by?: string;
  assigned_to?: string; // Filter by assigned user
  is_active?: boolean;
  due_date_from?: Date;
  due_date_to?: Date;
  list_type?: 'active' | 'pending' | 'completed'; // Filter by task category
}
