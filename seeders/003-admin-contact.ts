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

  // Get email contact type ID
  const [contactTypes] = await queryInterface.sequelize.query(
    "SELECT id FROM contact_types WHERE contact_type = 'email' LIMIT 1"
  );

  if (contactTypes.length === 0) {
    throw new Error('Email contact type not found. Run seeders in order.');
  }

  const emailContactTypeId = (contactTypes[0] as { id: string }).id;

  // Create admin email contact
  await queryInterface.bulkInsert('user_contacts', [
    {
      id: uuidv4(),
      user_id: adminUserId,
      contact_type_id: emailContactTypeId,
      contact: 'admin@example.com',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ], {});
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.bulkDelete('user_contacts', {
    contact: 'admin@example.com',
  }, {});
};
