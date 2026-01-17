import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Get user role ID
  const [userRoles] = await queryInterface.sequelize.query(
    "SELECT id FROM roles WHERE name = 'User' LIMIT 1"
  );

  if (userRoles.length === 0) {
    throw new Error('User role not found. Run seeders in order.');
  }

  const userRoleId = (userRoles[0] as { id: string }).id;

  // Get read permissions for user role
  const [permissions] = await queryInterface.sequelize.query(`
    SELECT id FROM permissions 
    WHERE is_active = true 
    AND action = 'read'
  `);

  // Assign read permissions to user role
  const rolePermissions = permissions.map((permission) => ({
    id: uuidv4(),
    role_id: userRoleId,
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
  // Get user role ID
  const [userRoles] = await queryInterface.sequelize.query(
    "SELECT id FROM roles WHERE name = 'User' LIMIT 1"
  );

  if (userRoles.length > 0) {
    const userRoleId = (userRoles[0] as { id: string }).id;
    await queryInterface.bulkDelete('role_permissions', {
      role_id: userRoleId,
    }, {});
  }
};
