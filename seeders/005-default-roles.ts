import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const roles = [
    {
      id: uuidv4(),
      name: 'Super Admin',
      description: 'Super Administrator with full system access',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      name:'Admin',
      description: 'Administrator with management access',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      name:'User',
      description: 'Regular user with basic read-only access',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  await queryInterface.bulkInsert('roles', roles, {});
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.bulkDelete('roles', {
    name: ['Super Admin','Admin','User'],
  }, {});
};
