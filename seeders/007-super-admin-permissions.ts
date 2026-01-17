import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Get Super Admin role ID
  const [superAdminRoles] = await queryInterface.sequelize.query(
    "SELECT id FROM roles WHERE name = 'Super Admin' LIMIT 1"
  );

  if (superAdminRoles.length === 0) {
    throw new Error('Super Admin role not found. Run seeders in order.');
  }

  const superAdminRoleId = (superAdminRoles[0] as { id: string }).id;

  // Get all permissions
  const [permissions] = await queryInterface.sequelize.query(
    'SELECT id FROM permissions WHERE is_active = true'
  );

  // Assign all permissions to Super Admin role
  const rolePermissions = permissions.map((permission) => ({
    id: uuidv4(),
    role_id: superAdminRoleId,
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
  // Get Super Admin role ID
  const [superAdminRoles] = await queryInterface.sequelize.query(
    "SELECT id FROM roles WHERE name = 'Super Admin' LIMIT 1"
  );

  if (superAdminRoles.length > 0) {
    const superAdminRoleId = (superAdminRoles[0] as { id: string }).id;
    await queryInterface.bulkDelete('role_permissions', {
      role_id: superAdminRoleId,
    }, {});
  }
};
