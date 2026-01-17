import { DataTypes, ModelAttributes, Sequelize } from 'sequelize';
import { BaseModel } from './base.model';
import { BaseAttributes, BaseCreationAttributes } from '../types/database.types';

export interface UserAttributes extends BaseAttributes {
  username: string;
  password_hash: string;
  first_name: string | null;
  last_name: string | null;
  is_verified: boolean;
}

export interface UserCreationAttributes extends BaseCreationAttributes {
  username: string;
  password_hash: string;
  first_name?: string | null;
  last_name?: string | null;
  is_verified?: boolean;
}

export class User extends BaseModel<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare username: string;
  declare password_hash: string;
  declare first_name: string | null;
  declare last_name: string | null;
  declare is_verified: boolean;

  static initialize(sequelize: Sequelize): void {
    const attributes: ModelAttributes = {
      ...BaseModel.getBaseAttributes(),
      username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [3, 100],
        },
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    };

    User.init(attributes, {
      ...BaseModel.getBaseOptions(),
      sequelize,
      modelName: 'User',
      tableName: 'users',
    });
  }
}
