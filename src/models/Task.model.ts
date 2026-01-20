import { DataTypes, ModelAttributes, Sequelize } from 'sequelize';
import { BaseModel } from './base.model';
import { BaseAttributes, BaseCreationAttributes } from '../types/database.types';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export interface TaskAttributes extends BaseAttributes {
  project_id: string;
  title: string;
  task_type: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  created_by: string;
  started_date: Date | null;
  due_date: Date | null;
  input_file_url: string | null;
  output_file_url: string | null;
}

export interface TaskCreationAttributes extends BaseCreationAttributes {
  project_id: string;
  title: string;
  task_type: string;
  description?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  created_by: string;
  started_date?: Date | null;
  due_date?: Date | null;
  input_file_url?: string | null;
  output_file_url?: string | null;
}

export class Task extends BaseModel<TaskAttributes, TaskCreationAttributes> implements TaskAttributes {
  declare project_id: string;
  declare title: string;
  declare task_type: string;
  declare description: string | null;
  declare priority: TaskPriority;
  declare status: TaskStatus;
  declare created_by: string;
  declare started_date: Date | null;
  declare due_date: Date | null;
  declare input_file_url: string | null;
  declare output_file_url: string | null;

  static initialize(sequelize: Sequelize): void {
    const attributes: ModelAttributes = {
      ...BaseModel.getBaseAttributes(),
      project_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'projects',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 255],
        },
      },
      task_type: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      priority: {
        type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
        allowNull: false,
        defaultValue: 'MEDIUM',
        validate: {
          isIn: [['LOW', 'MEDIUM', 'HIGH']],
        },
      },
      status: {
        type: DataTypes.ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'),
        allowNull: false,
        defaultValue: 'TODO',
        validate: {
          isIn: [['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']],
        },
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
      started_date: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isDate: true,
        },
      },
      due_date: {
        type: DataTypes.DATE,
        allowNull: true,
        validate: {
          isDate: true,
        },
      },
    };

    Task.init(attributes, {
      ...BaseModel.getBaseOptions(),
      sequelize,
      modelName: 'Task',
      tableName: 'tasks',
    });
  }
}
