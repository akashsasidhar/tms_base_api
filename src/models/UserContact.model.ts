import { DataTypes, ModelAttributes, Sequelize } from 'sequelize';
import { BaseModel } from './base.model';
import { BaseAttributes, BaseCreationAttributes } from '../types/database.types';

export interface UserContactAttributes extends BaseAttributes {
  user_id: string;
  contact_type_id: string;
  contact: string;
  is_primary: boolean;
}

export interface UserContactCreationAttributes extends BaseCreationAttributes {
  user_id: string;
  contact_type_id: string;
  contact: string;
  is_primary?: boolean;
}

export class UserContact extends BaseModel<UserContactAttributes, UserContactCreationAttributes> implements UserContactAttributes {
  declare user_id: string;
  declare contact_type_id: string;
  declare contact: string;
  declare is_primary: boolean;

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
      contact_type_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'contact_types',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      contact: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      is_primary: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    };

    UserContact.init(attributes, {
      ...BaseModel.getBaseOptions(),
      sequelize,
      modelName: 'UserContact',
      tableName: 'user_contacts',
    });
  }
}
