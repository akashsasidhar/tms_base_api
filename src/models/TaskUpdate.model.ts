import { DataTypes, ModelAttributes, Sequelize } from 'sequelize';
import { BaseModel } from './base.model';
import { BaseAttributes, BaseCreationAttributes } from '../types/database.types';
import type { TaskStatus } from './Task.model';

// Extend BaseAttributes but override updated_by to be required (business field)
export interface TaskUpdateAttributes extends Omit<BaseAttributes, 'updated_by'> {
  task_id: string;
  updated_by: string; // Business field: who updated the task status
  old_status: TaskStatus | null;
  new_status: TaskStatus;
  comment: string | null;
}

export interface TaskUpdateCreationAttributes extends BaseCreationAttributes {
  task_id: string;
  updated_by: string;
  old_status?: TaskStatus | null;
  new_status: TaskStatus;
  comment?: string | null;
}

export class TaskUpdate extends BaseModel<TaskUpdateAttributes, TaskUpdateCreationAttributes> implements TaskUpdateAttributes {
  declare task_id: string;
  declare updated_by: string;
  declare old_status: TaskStatus | null;
  declare new_status: TaskStatus;
  declare comment: string | null;

  static initialize(sequelize: Sequelize): void {
    // Get base attributes but exclude updated_by since we're using it as a business field
    const baseAttributes = BaseModel.getBaseAttributes();
    const { updated_by: _, ...baseAttrsWithoutUpdatedBy } = baseAttributes;
    
    const attributes: ModelAttributes = {
      ...baseAttrsWithoutUpdatedBy,
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
      updated_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      old_status: {
        type: DataTypes.ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'),
        allowNull: true,
        validate: {
          isIn: [['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', null]],
        },
      },
      new_status: {
        type: DataTypes.ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'),
        allowNull: false,
        validate: {
          isIn: [['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']],
        },
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    };

    TaskUpdate.init(attributes, {
      ...BaseModel.getBaseOptions(),
      sequelize,
      modelName: 'TaskUpdate',
      tableName: 'task_updates',
    });
  }
}
