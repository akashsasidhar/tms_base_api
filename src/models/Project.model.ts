import { DataTypes, ModelAttributes, Sequelize } from 'sequelize';
import { BaseModel } from './base.model';
import { BaseAttributes, BaseCreationAttributes } from '../types/database.types';

export interface ProjectAttributes extends BaseAttributes {
  name: string;
  description: string | null;
  created_by: string;
  project_manager_id: string | null;
  start_date: Date | null;
  end_date: Date | null;
}

export interface ProjectCreationAttributes extends BaseCreationAttributes {
  name: string;
  description?: string | null;
  created_by: string;
  project_manager_id?: string | null;
  start_date?: Date | null;
  end_date?: Date | null;
}

export class Project extends BaseModel<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  declare name: string;
  declare description: string | null;
  declare created_by: string;
  declare project_manager_id: string | null;
  declare start_date: Date | null;
  declare end_date: Date | null;

  static initialize(sequelize: Sequelize): void {
    const attributes: ModelAttributes = {
      ...BaseModel.getBaseAttributes(),
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 255],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      project_manager_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isDate: true,
        },
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isDate: true,
        },
      },
    };

    Project.init(attributes, {
      ...BaseModel.getBaseOptions(),
      sequelize,
      modelName: 'Project',
      tableName: 'projects',
    });
  }
}
