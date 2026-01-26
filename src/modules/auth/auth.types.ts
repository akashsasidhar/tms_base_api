import { UserContact, Role } from '../../models';

export interface RegisterRequest {
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
  contacts: {
    contact_type: string;
    contact: string;
  }[];
}

export interface LoginRequest {
  contact: string;
  password: string;
  contact_type?: string;
}

export interface UserContactWithType {
  id: string;
  contact: string;
  contactType: {
    id: string;
    contact_type: string;
  };
}

export interface UserWithRoles {
  id: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  contacts: UserContactWithType[];
  roles: Role[];
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user?: UserWithRoles;
    accessToken?: string;
    refreshToken?: string;
    permissions?: string[];
    // For unverified accounts
    user_id?: string;
    email?: string;
    requires_verification?: boolean;
  };
  errors?: string[];
}

export interface TokenPayload {
  userId: string;
  username: string;
  roles: string[];
  type: 'access' | 'refresh';
}
