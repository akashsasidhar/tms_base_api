import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const resources = ['users', 'roles', 'permissions', 'contacts', 'contact_types'];
  const actions = ['create', 'read', 'update', 'delete'];
  const permissions = [];

  resources.forEach((resource) => {
    actions.forEach((action) => {
      permissions.push({
        id: uuidv4(),
        resource,
        action,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });
    });
  });

  await queryInterface.bulkInsert('permissions', permissions, {});
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.bulkDelete('permissions', null, {});
};
