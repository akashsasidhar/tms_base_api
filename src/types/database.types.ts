import { Optional } from 'sequelize';

/**
 * Base interface for all models with audit columns
 */
export interface BaseAttributes {
  id: string;
  is_active: boolean;
  created_at: Date;
  created_by: string | null;
  updated_at: Date;
  updated_by: string | null;
  deleted_at: Date | null;
  deleted_by: string | null;
}

/**
 * Base creation attributes (without id and timestamps)
 */
export interface BaseCreationAttributes extends Optional<BaseAttributes, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'created_by' | 'updated_by' | 'deleted_at' | 'deleted_by'> {}
