import { DataTypes, ModelAttributes, Sequelize } from 'sequelize';
import { BaseModel } from './base.model';
import { BaseAttributes, BaseCreationAttributes } from '../types/database.types';

export interface UserVerificationTokenAttributes extends BaseAttributes {
  user_id: string;
  token_hash: string;
  expires_at: Date;
  is_used: boolean;
}

export interface UserVerificationTokenCreationAttributes extends BaseCreationAttributes {
  user_id: string;
  token_hash: string;
  expires_at: Date;
  is_used?: boolean;
}

export class UserVerificationToken extends BaseModel<
  UserVerificationTokenAttributes,
  UserVerificationTokenCreationAttributes
> implements UserVerificationTokenAttributes {
  declare user_id: string;
  declare token_hash: string;
  declare expires_at: Date;
  declare is_used: boolean;

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
      token_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: true,
        },
      },
      is_used: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    };

    UserVerificationToken.init(attributes, {
      ...BaseModel.getBaseOptions(),
      sequelize,
      modelName: 'UserVerificationToken',
      tableName: 'user_verification_tokens',
    });
  }

  /**
   * Check if token is expired
   */
  isExpired(): boolean {
    return new Date() > this.expires_at;
  }

  /**
   * Check if token is valid (not expired and not used)
   */
  isValid(): boolean {
    return !this.isExpired() && !this.is_used;
  }
}
