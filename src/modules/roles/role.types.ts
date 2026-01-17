export interface CreateRoleDto {
  name: string;
  description?: string | null;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

export interface PermissionDto {
  id: string;
  resource: string;
  action: string;
  permission: string; // resource:action format
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserWithRoleDto {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  assigned_at: Date;
}

export interface RoleResponseDto {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  permissions: PermissionDto[];
  users_count: number;
  permissions_count: number;
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
}

export interface RoleWithStatsDto {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  users_count: number;
  permissions_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface RoleListResponseDto {
  roles: RoleWithStatsDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface AssignPermissionsDto {
  permission_ids: string[];
}

export interface RemovePermissionsDto {
  permission_ids: string[];
}
