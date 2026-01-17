export interface CreateUserDto {
  username: string;
  password?: string; // Optional - will use default password from config if not provided
  first_name?: string;
  last_name?: string;
  contacts: {
    contact_type_id: string;
    contact: string;
  }[];
  role_ids?: string[];
}

export interface UpdateUserDto {
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
}

export interface AddContactDto {
  contact_type_id: string;
  contact: string;
}

export interface UpdateContactDto {
  contact?: string;
}

export interface ContactDto {
  id: string;
  contact_type_id: string;
  contact_type: string;
  contact: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RoleDto {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserResponseDto {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  contacts: ContactDto[];
  roles: RoleDto[];
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
}

export interface UserListResponseDto {
  users: UserResponseDto[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}
