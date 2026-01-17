import { DataTypes, ModelAttributes, Sequelize } from 'sequelize';
import { BaseModel } from './base.model';
import { BaseAttributes, BaseCreationAttributes } from '../types/database.types';

export interface UserRoleAttributes extends BaseAttributes {
  user_id: string;
  role_id: string;
  description: string | null;
}

export interface UserRoleCreationAttributes extends BaseCreationAttributes {
  user_id: string;
  role_id: string;
  description?: string | null;
}

export class UserRole extends BaseModel<UserRoleAttributes, UserRoleCreationAttributes> implements UserRoleAttributes {
  declare user_id: string;
  declare role_id: string;
  declare description: string | null;

  static initialize(sequelize: Sequelize): void {
    const attributes: ModelAttributes = {
      ...BaseModel.getBaseAttributes(),
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      role_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    };

    UserRole.init(attributes, {
      ...BaseModel.getBaseOptions(),
      sequelize,
      modelName: 'UserRole',
      tableName: 'user_roles',
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'role_id'],
          name: 'unique_user_role',
        },
      ],
    });
  }
}
