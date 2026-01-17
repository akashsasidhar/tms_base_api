import { DataTypes, ModelAttributes, Sequelize } from 'sequelize';
import { BaseModel } from './base.model';
import { BaseAttributes, BaseCreationAttributes } from '../types/database.types';

export interface RefreshTokenAttributes extends BaseAttributes {
  user_id: string;
  token_hash: string;
  expires_at: Date;
}

export interface RefreshTokenCreationAttributes extends BaseCreationAttributes {
  user_id: string;
  token_hash: string;
  expires_at: Date;
}

export class RefreshToken extends BaseModel<RefreshTokenAttributes, RefreshTokenCreationAttributes> implements RefreshTokenAttributes {
  declare user_id: string;
  declare token_hash: string;
  declare expires_at: Date;

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
    };

    RefreshToken.init(attributes, {
      ...BaseModel.getBaseOptions(),
      sequelize,
      modelName: 'RefreshToken',
      tableName: 'refresh_tokens',
    });
  }

  /**
   * Check if token is expired
   */
  isExpired(): boolean {
    return new Date() > this.expires_at;
  }
}
