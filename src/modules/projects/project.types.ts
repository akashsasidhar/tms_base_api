/**
 * Project DTOs and Types
 */

export interface CreateProjectDto {
  name: string;
  description?: string | null;
  project_manager_id?: string | null;
  start_date?: Date | null;
  end_date?: Date | null;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string | null;
  project_manager_id?: string | null;
  start_date?: Date | null;
  end_date?: Date | null;
  is_active?: boolean;
}

export interface ProjectResponseDto {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  project_manager_id: string | null;
  start_date: Date | null;
  end_date: Date | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  created_by_user?: {
    id: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  project_manager?: {
    id: string;
    username: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export interface ProjectFilters {
  name?: string;
  created_by?: string;
  is_active?: boolean;
  start_date_from?: Date;
  start_date_to?: Date;
  end_date_from?: Date;
  end_date_to?: Date;
}

/**
 * Simplified project DTO for list endpoint (reusable, no permission required)
 */
export interface ProjectSelectDto {
  id: string;
  name: string;
  is_active: boolean;
}
