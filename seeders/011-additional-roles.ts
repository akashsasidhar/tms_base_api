import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Check which roles already exist
  const [existingRoles] = await queryInterface.sequelize.query(
    "SELECT name FROM roles WHERE name IN ('Project Manager', 'Developer', 'Designer', 'Marketing')"
  );

  const existingRoleNames = (existingRoles as { name: string }[]).map(r => r.name);

  const rolesToAdd = [
    {
      id: uuidv4(),
      name: 'Project Manager',
      description: 'Project Manager with project management and team coordination access',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      name: 'Developer',
      description: 'Developer with technical development and coding access',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      name: 'Designer',
      description: 'Designer with design and creative content access',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: uuidv4(),
      name: 'Marketing',
      description: 'Marketing professional with marketing and promotional content access',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ].filter(role => !existingRoleNames.includes(role.name));

  if (rolesToAdd.length > 0) {
    await queryInterface.bulkInsert('roles', rolesToAdd, {});
  }
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.bulkDelete('roles', {
    name: ['Project Manager', 'Developer', 'Designer', 'Marketing'],
  }, {});
};
