import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Get Project Manager role ID
  const [projectManagerRoles] = await queryInterface.sequelize.query(
    "SELECT id FROM roles WHERE name = 'Project Manager' LIMIT 1"
  );

  if (projectManagerRoles.length === 0) {
    throw new Error('Project Manager role not found. Run seeders in order.');
  }

  const projectManagerRoleId = (projectManagerRoles[0] as { id: string }).id;

  // Get permissions for Project Manager role
  const [permissions] = await queryInterface.sequelize.query(`
    SELECT id FROM permissions 
    WHERE is_active = true 
    AND (
      (resource = 'projects' AND action IN ('create', 'read', 'update'))
      OR (resource = 'tasks' AND action IN ('create', 'read', 'update'))
    )
  `);

  // Check existing role permissions to avoid duplicates
  const [existingRolePermissions] = await queryInterface.sequelize.query(`
    SELECT permission_id FROM role_permissions 
    WHERE role_id = '${projectManagerRoleId}' 
    AND deleted_at IS NULL
  `);
  
  const existingPermissionIds = new Set(
    existingRolePermissions.map((rp: any) => rp.permission_id)
  );

  // Filter out permissions that already exist
  const newRolePermissions = permissions
    .filter((permission: any) => !existingPermissionIds.has(permission.id))
    .map((permission: any) => ({
      id: uuidv4(),
      role_id: projectManagerRoleId,
      permission_id: permission.id,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }));

  if (newRolePermissions.length > 0) {
    await queryInterface.bulkInsert('role_permissions', newRolePermissions, {});
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Get Project Manager role ID
  const [projectManagerRoles] = await queryInterface.sequelize.query(
    "SELECT id FROM roles WHERE name = 'Project Manager' LIMIT 1"
  );

  if (projectManagerRoles.length > 0) {
    const projectManagerRoleId = (projectManagerRoles[0] as { id: string }).id;
    await queryInterface.bulkDelete('role_permissions', {
      role_id: projectManagerRoleId,
    }, {});
  }
};
