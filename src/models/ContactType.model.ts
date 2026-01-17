import { DataTypes, ModelAttributes, Sequelize } from 'sequelize';
import { BaseModel } from './base.model';
import { BaseAttributes, BaseCreationAttributes } from '../types/database.types';

export interface ContactTypeAttributes extends BaseAttributes {
  contact_type: string;
}

export interface ContactTypeCreationAttributes extends BaseCreationAttributes {
  contact_type: string;
}

export class ContactType extends BaseModel<ContactTypeAttributes, ContactTypeCreationAttributes> implements ContactTypeAttributes {
  declare contact_type: string;

  static initialize(sequelize: Sequelize): void {
    const attributes: ModelAttributes = {
      ...BaseModel.getBaseAttributes(),
      contact_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [1, 50],
        },
      },
    };

    ContactType.init(attributes, {
      ...BaseModel.getBaseOptions(),
      sequelize,
      modelName: 'ContactType',
      tableName: 'contact_types',
    });
  }
}
