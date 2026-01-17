import { DataTypes, ModelAttributes, Sequelize } from 'sequelize';
import { BaseModel } from './base.model';
import { BaseAttributes, BaseCreationAttributes } from '../types/database.types';

export interface RolePermissionAttributes extends BaseAttributes {
  role_id: string;
  permission_id: string;
}

export interface RolePermissionCreationAttributes extends BaseCreationAttributes {
  role_id: string;
  permission_id: string;
}

export class RolePermission extends BaseModel<RolePermissionAttributes, RolePermissionCreationAttributes> implements RolePermissionAttributes {
  declare role_id: string;
  declare permission_id: string;

  static initialize(sequelize: Sequelize): void {
    const attributes: ModelAttributes = {
      ...BaseModel.getBaseAttributes(),
      role_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'roles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      permission_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'permissions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
    };

    RolePermission.init(attributes, {
      ...BaseModel.getBaseOptions(),
      sequelize,
      modelName: 'RolePermission',
      tableName: 'role_permissions',
      indexes: [
        {
          unique: true,
          fields: ['role_id', 'permission_id'],
          name: 'unique_role_permission',
        },
      ],
    });
  }
}
