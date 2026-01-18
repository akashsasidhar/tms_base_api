import { QueryInterface } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  // Check if projects permissions already exist
  const [existingPermissions] = await queryInterface.sequelize.query(`
    SELECT id FROM permissions 
    WHERE resource = 'projects' 
    AND is_active = true
    LIMIT 1
  `);

  if (existingPermissions.length > 0) {
    console.log('Projects permissions already exist, skipping...');
    return;
  }

  // Create projects permissions
  const actions = ['create', 'read', 'update', 'delete'];
  const permissions = [];

  actions.forEach((action) => {
    permissions.push({
      id: uuidv4(),
      resource: 'projects',
      action,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
  });

  await queryInterface.bulkInsert('permissions', permissions, {});
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.bulkDelete('permissions', {
    resource: 'projects',
  }, {});
};
