import { DataTypes, ModelAttributes, Sequelize } from 'sequelize';
import { BaseModel } from './base.model';
import { BaseAttributes, BaseCreationAttributes } from '../types/database.types';

export interface RoleAttributes extends BaseAttributes {
  name: string;
  description: string | null;
}

export interface RoleCreationAttributes extends BaseCreationAttributes {
  name: string;
  description?: string | null;
}

export class Role extends BaseModel<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  declare name: string;
  declare description: string | null;

  static initialize(sequelize: Sequelize): void {
    const attributes: ModelAttributes = {
      ...BaseModel.getBaseAttributes(),
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [1, 100],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    };

    Role.init(attributes, {
      ...BaseModel.getBaseOptions(),
      sequelize,
      modelName: 'Role',
      tableName: 'roles',
    });
  }
}
