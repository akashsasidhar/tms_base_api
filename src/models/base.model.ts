import {
  Model,
  DataTypes,
  ModelAttributes,
  ModelOptions,
} from 'sequelize';
import { BaseAttributes, BaseCreationAttributes } from '../types/database.types';

/**
 * Abstract base model with all audit columns
 * All models should extend this base model
 */
export abstract class BaseModel<
  TAttributes extends BaseAttributes = BaseAttributes,
  TCreationAttributes extends BaseCreationAttributes = BaseCreationAttributes
> extends Model<TAttributes, TCreationAttributes> implements BaseAttributes {
  declare id: string;
  declare is_active: boolean;
  declare created_at: Date;
  declare created_by: string | null;
  declare updated_at: Date;
  declare updated_by: string | null;
  declare deleted_at: Date | null;
  declare deleted_by: string | null;

  /**
   * Get base model attributes
   */
  static getBaseAttributes(): ModelAttributes {
    return {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deleted_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    };
  }

  /**
   * Get base model options
   */
  static getBaseOptions(): ModelOptions {
    return {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: true,
      deletedAt: 'deleted_at',
      underscored: true,
      hooks: {
        beforeUpdate: (instance: BaseModel) => {
          instance.updated_at = new Date();
        },
        beforeCreate: (instance: BaseModel) => {
          instance.created_at = new Date();
          instance.updated_at = new Date();
          if (instance.is_active === undefined) {
            instance.is_active = true;
          }
        },
      },
    };
  }

  /**
   * Soft delete instance
   */
  async softDelete(deletedBy?: string): Promise<void> {
    this.deleted_at = new Date();
    if (deletedBy !== undefined) {
      this.deleted_by = deletedBy;
    }
    await this.save();
  }

  /**
   * Restore soft deleted instance
   */
  override async restore(): Promise<void> {
    this.deleted_at = null;
    this.deleted_by = null;
    await this.save();
  }
}
