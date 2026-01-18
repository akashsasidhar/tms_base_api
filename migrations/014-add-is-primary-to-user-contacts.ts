import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.addColumn('user_contacts', 'is_primary', {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  // Add index for is_primary column
  await queryInterface.addIndex('user_contacts', ['is_primary'], {
    name: 'user_contacts_is_primary_idx',
  });

  // Set is_primary = true for contacts that are "primary email" or "primary mobile"
  // This is a one-time data migration
  // Note: Using raw query for MySQL/MariaDB compatibility
  const [results] = await queryInterface.sequelize.query(`
    UPDATE user_contacts uc
    SET is_primary = true
    FROM contact_types ct
    WHERE uc.contact_type_id = ct.id
      AND LOWER(ct.contact_type) IN (
        'primary email',
        'primary_email',
        'primary mobile',
        'primary_mobile'
      )
      AND uc.deleted_at IS NULL;
  `);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.removeIndex('user_contacts', 'user_contacts_is_primary_idx');
  await queryInterface.removeColumn('user_contacts', 'is_primary');
};
