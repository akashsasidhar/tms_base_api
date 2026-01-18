import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Insert tasks permissions
  const permissions = [
    {
      id: uuidv4(),
      resource: 'tasks',
      action: 'create',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      resource: 'tasks',
      action: 'read',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      resource: 'tasks',
      action: 'update',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      resource: 'tasks',
      action: 'delete',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      resource: 'tasks',
      action: 'manage',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  // Check if permissions already exist before inserting
  for (const permission of permissions) {
    const [existing] = await queryInterface.sequelize.query(
      `SELECT id FROM permissions WHERE resource = '${permission.resource}' AND action = '${permission.action}' LIMIT 1`
    );
    if ((existing as any[]).length === 0) {
      await queryInterface.bulkInsert('permissions', [permission], {});
    }
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.bulkDelete('permissions', {
    resource: 'tasks',
  });
};
