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

  // Get tasks:read and tasks:update permissions for assignees
  const [permissions] = await queryInterface.sequelize.query(`
    SELECT id, action FROM permissions 
    WHERE is_active = true 
    AND resource = 'tasks' 
    AND action IN ('read', 'update')
  `);

  if (permissions.length === 0) {
    throw new Error('tasks:read or tasks:update permissions not found. Run tasks permissions seeder first.');
  }

  const tasksReadPermission = permissions.find((p: any) => p.action === 'read') as { id: string } | undefined;
  const tasksUpdatePermission = permissions.find((p: any) => p.action === 'update') as { id: string } | undefined;

  if (!tasksReadPermission || !tasksUpdatePermission) {
    throw new Error('tasks:read or tasks:update permission not found. Run tasks permissions seeder first.');
  }

  const tasksReadPermissionId = tasksReadPermission.id;
  const tasksUpdatePermissionId = tasksUpdatePermission.id;

  // Assign tasks:read and tasks:update permissions to each role
  for (const role of roles as Array<{ id: string; name: string }>) {
    // Assign tasks:read permission
    const [existingReadPermissions] = await queryInterface.sequelize.query(`
      SELECT permission_id FROM role_permissions 
      WHERE role_id = '${role.id}' 
      AND permission_id = '${tasksReadPermissionId}'
      AND deleted_at IS NULL
    `);

    if (existingReadPermissions.length === 0) {
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

    // Assign tasks:update permission
    const [existingUpdatePermissions] = await queryInterface.sequelize.query(`
      SELECT permission_id FROM role_permissions 
      WHERE role_id = '${role.id}' 
      AND permission_id = '${tasksUpdatePermissionId}'
      AND deleted_at IS NULL
    `);

    if (existingUpdatePermissions.length === 0) {
      await queryInterface.bulkInsert(
        'role_permissions',
        [
          {
            id: uuidv4(),
            role_id: role.id,
            permission_id: tasksUpdatePermissionId,
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

  // Get tasks:read and tasks:update permission IDs
  const [permissions] = await queryInterface.sequelize.query(`
    SELECT id, action FROM permissions 
    WHERE resource = 'tasks' 
    AND action IN ('read', 'update')
  `);

  if (roles.length > 0 && permissions.length > 0) {
    const tasksReadPermission = permissions.find((p: any) => p.action === 'read') as { id: string } | undefined;
    const tasksUpdatePermission = permissions.find((p: any) => p.action === 'update') as { id: string } | undefined;
    const roleIds = roles.map((r: any) => r.id).map((id: string) => `'${id}'`).join(',');

    if (tasksReadPermission) {
      await queryInterface.sequelize.query(`
        DELETE FROM role_permissions 
        WHERE role_id IN (${roleIds})
        AND permission_id = '${tasksReadPermission.id}'
      `);
    }

    if (tasksUpdatePermission) {
      await queryInterface.sequelize.query(`
        DELETE FROM role_permissions 
        WHERE role_id IN (${roleIds})
        AND permission_id = '${tasksUpdatePermission.id}'
      `);
    }
  }
};
