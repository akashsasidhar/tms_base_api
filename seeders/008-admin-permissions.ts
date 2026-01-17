import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Get admin role ID
  const [adminRoles] = await queryInterface.sequelize.query(
    "SELECT id FROM roles WHERE name = 'Admin' LIMIT 1"
  );

  if (adminRoles.length === 0) {
    throw new Error('Admin role not found. Run seeders in order.');
  }

  const adminRoleId = (adminRoles[0] as { id: string }).id;

  // Get permissions for admin role
  const [permissions] = await queryInterface.sequelize.query(`
    SELECT id FROM permissions 
    WHERE is_active = true 
    AND (
      (resource = 'users' AND action IN ('create', 'read', 'update', 'delete'))
      OR (resource = 'roles' AND action = 'read')
      OR (resource = 'permissions' AND action = 'read')
      OR (resource = 'contacts' AND action IN ('create', 'read', 'update', 'delete'))
      OR (resource = 'contact_types' AND action IN ('create', 'read', 'update', 'delete'))
    )
  `);

  // Assign permissions to admin role
  const rolePermissions = permissions.map((permission) => ({
    id: uuidv4(),
    role_id: adminRoleId,
    permission_id: (permission as { id: string }).id,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  }));

  if (rolePermissions.length > 0) {
    await queryInterface.bulkInsert('role_permissions', rolePermissions, {});
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Get admin role ID
  const [adminRoles] = await queryInterface.sequelize.query(
    "SELECT id FROM roles WHERE name = 'Admin' LIMIT 1"
  );

  if (adminRoles.length > 0) {
    const adminRoleId = (adminRoles[0] as { id: string }).id;
    await queryInterface.bulkDelete('role_permissions', {
      role_id: adminRoleId,
    }, {});
  }
};
