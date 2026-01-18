import { DataTypes, ModelAttributes, Sequelize } from 'sequelize';
import { BaseModel } from './base.model';
import { BaseAttributes, BaseCreationAttributes } from '../types/database.types';

export interface TaskAssignmentAttributes extends BaseAttributes {
  task_id: string;
  user_id: string;
  assigned_by: string;
  assigned_at: Date;
}

export interface TaskAssignmentCreationAttributes extends BaseCreationAttributes {
  task_id: string;
  user_id: string;
  assigned_by: string;
  assigned_at?: Date;
}

export class TaskAssignment extends BaseModel<TaskAssignmentAttributes, TaskAssignmentCreationAttributes> implements TaskAssignmentAttributes {
  declare task_id: string;
  declare user_id: string;
  declare assigned_by: string;
  declare assigned_at: Date;

  static initialize(sequelize: Sequelize): void {
    const attributes: ModelAttributes = {
      ...BaseModel.getBaseAttributes(),
      task_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
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
      assigned_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      assigned_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        validate: {
          isDate: true,
        },
      },
    };

    TaskAssignment.init(attributes, {
      ...BaseModel.getBaseOptions(),
      sequelize,
      modelName: 'TaskAssignment',
      tableName: 'task_assignments',
    });
  }
}
