import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import appConfig from '../src/config/app-config';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const saltRounds = parseInt(appConfig.BCRYPT_ROUNDS, 10);
  const defaultPassword = appConfig.ADMIN_DEFAULT_PASSWORD;
  const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

  const adminUserId = uuidv4();

  // Create admin user
  await queryInterface.bulkInsert('users', [
    {
      id: adminUserId,
      username:'Admin',
      password_hash: passwordHash,
      first_name: 'System',
      last_name: 'Administrator',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ], {});
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.bulkDelete('users', {
    username:'Admin',
  }, {});
};
