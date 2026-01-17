import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Get admin user ID
  const [users] = await queryInterface.sequelize.query(
    "SELECT id FROM users WHERE username ='Admin' LIMIT 1"
  );

  if (users.length === 0) {
    throw new Error('Admin user not found. Run seeders in order.');
  }

  const adminUserId = (users[0] as { id: string }).id;

  // Get Super Admin role ID
  const [superAdminRoles] = await queryInterface.sequelize.query(
    "SELECT id FROM roles WHERE name = 'Super Admin' LIMIT 1"
  );

  if (superAdminRoles.length === 0) {
    throw new Error('Super Admin role not found. Run seeders in order.');
  }

  const superAdminRoleId = (superAdminRoles[0] as { id: string }).id;

  // Assign Super Admin role to admin user
  await queryInterface.bulkInsert('user_roles', [
    {
      id: uuidv4(),
      user_id: adminUserId,
      role_id: superAdminRoleId,
      description: 'Initial super admin user',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ], {});
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Get admin user ID
  const [users] = await queryInterface.sequelize.query(
    "SELECT id FROM users WHERE username ='Admin' LIMIT 1"
  );

  if (users.length > 0) {
    const adminUserId = (users[0] as { id: string }).id;
    // Get Super Admin role ID
    const [superAdminRoles] = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'Super Admin' LIMIT 1"
    );

    if (superAdminRoles.length > 0) {
      const superAdminRoleId = (superAdminRoles[0] as { id: string }).id;
      await queryInterface.bulkDelete('user_roles', {
        user_id: adminUserId,
        role_id: superAdminRoleId,
      }, {});
    }
  }
};
