import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.createTable('task_updates', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
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
    },
    new_status: {
      type: DataTypes.ENUM('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'),
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
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
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
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
  await queryInterface.addIndex('task_updates', ['task_id'], {
    name: 'task_updates_task_id_idx',
  });
  await queryInterface.addIndex('task_updates', ['updated_by'], {
    name: 'task_updates_updated_by_idx',
  });
  await queryInterface.addIndex('task_updates', ['new_status'], {
    name: 'task_updates_new_status_idx',
  });
  await queryInterface.addIndex('task_updates', ['is_active'], {
    name: 'task_updates_is_active_idx',
  });
  await queryInterface.addIndex('task_updates', ['old_status'], {
    name: 'task_updates_old_status_idx',
  });
  await queryInterface.addIndex('task_updates', ['created_at'], {
    name: 'task_updates_created_at_idx',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.dropTable('task_updates');
};
