import { DataTypes, ModelAttributes, Sequelize } from 'sequelize';
import { BaseModel } from './base.model';
import { BaseAttributes, BaseCreationAttributes } from '../types/database.types';

export interface PermissionAttributes extends BaseAttributes {
  resource: string;
  action: string;
}

export interface PermissionCreationAttributes extends BaseCreationAttributes {
  resource: string;
  action: string;
}

export class Permission extends BaseModel<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  declare resource: string;
  declare action: string;

  static initialize(sequelize: Sequelize): void {
    const attributes: ModelAttributes = {
      ...BaseModel.getBaseAttributes(),
      resource: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 100],
        },
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 50],
          isIn: [['create', 'read', 'update', 'delete', 'manage']],
        },
      },
    };

    Permission.init(attributes, {
      ...BaseModel.getBaseOptions(),
      sequelize,
      modelName: 'Permission',
      tableName: 'permissions',
      indexes: [
        {
          unique: true,
          fields: ['resource', 'action'],
          name: 'unique_resource_action',
        },
      ],
    });
  }
}
