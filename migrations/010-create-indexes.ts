import { QueryInterface } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Index on user_contacts for contact lookup
  await queryInterface.addIndex('user_contacts', ['contact', 'contact_type_id'], {
    name: 'idx_user_contacts_contact',
  });

  // Index on user_contacts for user lookup
  await queryInterface.addIndex('user_contacts', ['user_id'], {
    name: 'idx_user_contacts_user_id',
  });

  // Index on users for username lookup (already exists, but ensure it's there)
  await queryInterface.addIndex('users', ['username'], {
    name: 'idx_users_username',
    unique: true,
  });

  // Index on user_roles for user lookup
  await queryInterface.addIndex('user_roles', ['user_id'], {
    name: 'idx_user_roles_user_id',
  });

  // Index on user_roles for role lookup
  await queryInterface.addIndex('user_roles', ['role_id'], {
    name: 'idx_user_roles_role_id',
  });

  // Unique index on user_roles (user_id, role_id)
  await queryInterface.addIndex('user_roles', ['user_id', 'role_id'], {
    name: 'idx_user_role_unique',
    unique: true,
  });

  // Index on role_permissions for role lookup
  await queryInterface.addIndex('role_permissions', ['role_id'], {
    name: 'idx_role_permissions_role_id',
  });

  // Index on refresh_tokens for user lookup
  await queryInterface.addIndex('refresh_tokens', ['user_id'], {
    name: 'idx_refresh_tokens_user_id',
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.removeIndex('user_contacts', 'idx_user_contacts_contact');
  await queryInterface.removeIndex('user_contacts', 'idx_user_contacts_user_id');
  await queryInterface.removeIndex('users', 'idx_users_username');
  await queryInterface.removeIndex('user_roles', 'idx_user_roles_user_id');
  await queryInterface.removeIndex('user_roles', 'idx_user_roles_role_id');
  await queryInterface.removeIndex('user_roles', 'idx_user_role_unique');
  await queryInterface.removeIndex('role_permissions', 'idx_role_permissions_role_id');
  await queryInterface.removeIndex('refresh_tokens', 'idx_refresh_tokens_user_id');
};
