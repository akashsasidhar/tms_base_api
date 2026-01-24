/**
 * Script to check and fix Project Manager permissions
 * Run with: npx ts-node scripts/check-project-manager-permissions.ts
 */

import sequelize from '../src/config/database';
import { QueryInterface } from 'sequelize';

async function checkProjectManagerPermissions() {
  const queryInterface = sequelize.getQueryInterface();

  try {
    // Get Project Manager role ID
    const [projectManagerRoles] = await queryInterface.sequelize.query(
      "SELECT id, name FROM roles WHERE name = 'Project Manager' LIMIT 1"
    );

    if (projectManagerRoles.length === 0) {
      console.error('❌ Project Manager role not found!');
      console.log('Please run the role seeders first:');
      console.log('  npx sequelize-cli db:seed --seed 011-additional-roles.ts');
      return;
    }

    const projectManagerRole = projectManagerRoles[0] as { id: string; name: string };
    const projectManagerRoleId = projectManagerRole.id;
    console.log(`✅ Found Project Manager role: ${projectManagerRole.name} (${projectManagerRoleId})`);

    // Get all projects and tasks permissions
    const [allPermissions] = await queryInterface.sequelize.query(`
      SELECT id, resource, action, permission 
      FROM permissions 
      WHERE is_active = true 
      AND (
        (resource = 'projects' AND action IN ('create', 'read', 'update'))
        OR (resource = 'tasks' AND action IN ('create', 'read', 'update'))
      )
      ORDER BY resource, action
    `);

    console.log(`\n📋 Available permissions (${allPermissions.length}):`);
    (allPermissions as any[]).forEach((p: any) => {
      console.log(`   - ${p.resource}:${p.action} (${p.id})`);
    });

    // Get current Project Manager permissions
    const [currentPermissions] = await queryInterface.sequelize.query(`
      SELECT rp.permission_id, p.resource, p.action, p.permission
      FROM role_permissions rp
      INNER JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = '${projectManagerRoleId}'
      AND rp.deleted_at IS NULL
      AND rp.is_active = true
      ORDER BY p.resource, p.action
    `);

    console.log(`\n🔐 Current Project Manager permissions (${currentPermissions.length}):`);
    if (currentPermissions.length === 0) {
      console.log('   ⚠️  No permissions assigned!');
    } else {
      (currentPermissions as any[]).forEach((p: any) => {
        console.log(`   ✅ ${p.resource}:${p.action}`);
      });
    }

    // Check what's missing
    const currentPermissionIds = new Set(
      (currentPermissions as any[]).map((p: any) => p.permission_id)
    );

    const missingPermissions = (allPermissions as any[]).filter(
      (p: any) => !currentPermissionIds.has(p.id)
    );

    if (missingPermissions.length > 0) {
      console.log(`\n⚠️  Missing permissions (${missingPermissions.length}):`);
      missingPermissions.forEach((p: any) => {
        console.log(`   - ${p.resource}:${p.action}`);
      });

      console.log('\n🔧 Fixing permissions...');
      const { v4: uuidv4 } = await import('uuid');
      
      const newRolePermissions = missingPermissions.map((permission: any) => ({
        id: uuidv4(),
        role_id: projectManagerRoleId,
        permission_id: permission.id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      await queryInterface.bulkInsert('role_permissions', newRolePermissions, {});
      console.log(`✅ Added ${newRolePermissions.length} missing permissions!`);
    } else {
      console.log('\n✅ All required permissions are already assigned!');
    }

    // Final check
    const [finalPermissions] = await queryInterface.sequelize.query(`
      SELECT p.resource, p.action
      FROM role_permissions rp
      INNER JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = '${projectManagerRoleId}'
      AND rp.deleted_at IS NULL
      AND rp.is_active = true
      ORDER BY p.resource, p.action
    `);

    console.log(`\n📊 Final Project Manager permissions (${finalPermissions.length}):`);
    (finalPermissions as any[]).forEach((p: any) => {
      console.log(`   ✅ ${p.resource}:${p.action}`);
    });

  } catch (error) {
    console.error('❌ Error checking permissions:', error);
  } finally {
    await sequelize.close();
  }
}

checkProjectManagerPermissions();
