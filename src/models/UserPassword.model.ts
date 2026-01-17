import { DataTypes, ModelAttributes, Sequelize } from 'sequelize';
import { BaseModel } from './base.model';
import { BaseAttributes, BaseCreationAttributes } from '../types/database.types';

export interface UserPasswordAttributes extends BaseAttributes {
  user_id: string;
  password_hash: string;
}

export interface UserPasswordCreationAttributes extends BaseCreationAttributes {
  user_id: string;
  password_hash: string;
}

export class UserPassword extends BaseModel<UserPasswordAttributes, UserPasswordCreationAttributes> implements UserPasswordAttributes {
  declare user_id: string;
  declare password_hash: string;

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
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
    };

    UserPassword.init(attributes, {
      ...BaseModel.getBaseOptions(),
      sequelize,
      modelName: 'UserPassword',
      tableName: 'user_passwords',
    });
  }
}
