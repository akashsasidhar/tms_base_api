import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('tasks', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
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
    },
    task_type: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    priority: {
      type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
      allowNull: false,
      defaultValue: 'MEDIUM',
    },
    status: {
      type: DataTypes.ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'),
      allowNull: false,
      defaultValue: 'TODO',
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
    },
    due_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
  });

  // Add indexes
  await queryInterface.addIndex('tasks', ['project_id'], {
    name: 'tasks_project_id_idx',
  });
  await queryInterface.addIndex('tasks', ['created_by'], {
    name: 'tasks_created_by_idx',
  });
  await queryInterface.addIndex('tasks', ['priority'], {
    name: 'tasks_priority_idx',
  });
  await queryInterface.addIndex('tasks', ['status'], {
    name: 'tasks_status_idx',
  });
  await queryInterface.addIndex('tasks', ['is_active'], {
    name: 'tasks_is_active_idx',
  });
  await queryInterface.addIndex('tasks', ['due_date'], {
    name: 'tasks_due_date_idx',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('tasks');
};
