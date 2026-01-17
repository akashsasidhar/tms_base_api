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

  // Get password hash from user
  const [userData] = await queryInterface.sequelize.query(
    `SELECT password_hash FROM users WHERE id = '${adminUserId}' LIMIT 1`
  );

  if (userData.length === 0) {
    throw new Error('Admin user password hash not found.');
  }

  const passwordHash = (userData[0] as { password_hash: string }).password_hash;

  // Create password history entry
  await queryInterface.bulkInsert('user_passwords', [
    {
      id: uuidv4(),
      user_id: adminUserId,
      password_hash: passwordHash,
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
    await queryInterface.bulkDelete('user_passwords', {
      user_id: adminUserId,
    }, {});
  }
};
