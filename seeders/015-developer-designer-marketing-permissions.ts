import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Get Developer, Designer, and Marketing role IDs
  const [roles] = await queryInterface.sequelize.query(`
    SELECT id, name FROM roles 
    WHERE name IN ('Developer', 'Designer', 'Marketing')
  `);

  if (roles.length === 0) {
    throw new Error('Developer, Designer, or Marketing roles not found. Run seeders in order.');
  }

  // Get tasks:read permission for assignees
  const [permissions] = await queryInterface.sequelize.query(`
    SELECT id FROM permissions 
    WHERE is_active = true 
    AND resource = 'tasks' 
    AND action = 'read'
  `);

  if (permissions.length === 0) {
    throw new Error('tasks:read permission not found. Run tasks permissions seeder first.');
  }

  const tasksReadPermissionId = (permissions[0] as { id: string }).id;

  // Assign tasks:read permission to each role
  for (const role of roles as Array<{ id: string; name: string }>) {
    // Check existing role permissions to avoid duplicates
    const [existingRolePermissions] = await queryInterface.sequelize.query(`
      SELECT permission_id FROM role_permissions 
      WHERE role_id = '${role.id}' 
      AND permission_id = '${tasksReadPermissionId}'
      AND deleted_at IS NULL
    `);

    if (existingRolePermissions.length === 0) {
      await queryInterface.bulkInsert(
        'role_permissions',
        [
          {
            id: uuidv4(),
            role_id: role.id,
            permission_id: tasksReadPermissionId,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        {}
      );
    }
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Get Developer, Designer, and Marketing role IDs
  const [roles] = await queryInterface.sequelize.query(`
    SELECT id FROM roles 
    WHERE name IN ('Developer', 'Designer', 'Marketing')
  `);

  // Get tasks:read permission ID
  const [permissions] = await queryInterface.sequelize.query(`
    SELECT id FROM permissions 
    WHERE resource = 'tasks' 
    AND action = 'read'
  `);

  if (roles.length > 0 && permissions.length > 0) {
    const tasksReadPermissionId = (permissions[0] as { id: string }).id;
    const roleIds = roles.map((r: any) => r.id).map((id: string) => `'${id}'`).join(',');

    await queryInterface.sequelize.query(`
      DELETE FROM role_permissions 
      WHERE role_id IN (${roleIds})
      AND permission_id = '${tasksReadPermissionId}'
    `);
  }
};
