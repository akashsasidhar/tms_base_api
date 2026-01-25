import { Op } from 'sequelize';
import { Role, RolePermission, Permission, UserRole, User } from '../../models';
import { getPaginationParams, getPaginationMeta } from '../../helpers/pagination.helper';
import {
  CreateRoleDto,
  UpdateRoleDto,
  RoleResponseDto,
  RoleWithStatsDto,
  PermissionDto,
  UserWithRoleDto,
} from './role.types';
import sequelize from '../../config/database';

/**
 * Transform role model to response DTO with stats
 */
async function transformRoleToDto(role: Role): Promise<RoleResponseDto> {
  // Get permissions count
  const permissionsCount = await RolePermission.count({
    where: {
      role_id: role.id,
      deleted_at: null,
      is_active: true,
    },
  });

  // Get users count
  const usersCount = await UserRole.count({
    where: {
      role_id: role.id,
      deleted_at: null,
      is_active: true,
    },
  });

  // Get permissions
  const rolePermissions = await RolePermission.findAll({
    where: {
      role_id: role.id,
      deleted_at: null,
      is_active: true,
    },
    include: [
      {
        model: Permission,
        as: 'permission',
        where: { deleted_at: null, is_active: true },
        required: true,
      },
    ],
  });

  const permissions: PermissionDto[] = rolePermissions
    .map((rp) => (rp as RolePermission & { permission?: Permission }).permission)
    .filter((permission): permission is Permission => permission !== null && permission !== undefined)
    .map((permission) => ({
      id: permission.id,
      resource: permission.resource,
      action: permission.action,
      permission: `${permission.resource}:${permission.action}`,
      is_active: permission.is_active,
      created_at: permission.created_at,
      updated_at: permission.updated_at,
    }));

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    is_active: role.is_active,
    permissions,
    users_count: usersCount,
    permissions_count: permissionsCount,
    created_at: role.created_at,
    updated_at: role.updated_at,
    created_by: role.created_by,
    updated_by: role.updated_by,
  };
}

/**
 * Transform role to stats DTO (for list view)
 */
async function transformRoleToStatsDto(role: Role): Promise<RoleWithStatsDto> {
  // Get permissions count
  const permissionsCount = await RolePermission.count({
    where: {
      role_id: role.id,
      deleted_at: null,
      is_active: true,
    },
  });

  // Get users count
  const usersCount = await UserRole.count({
    where: {
      role_id: role.id,
      deleted_at: null,
      is_active: true,
    },
  });

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    is_active: role.is_active,
    users_count: usersCount,
    permissions_count: permissionsCount,
    created_at: role.created_at,
    updated_at: role.updated_at,
  };
}

/**
 * Role Service - Handles all role management business logic
 */
export class RoleService {
  /**
   * Get roles for task type selection (simple list, no pagination)
   * Returns only active roles with id and name
   */
  static async getRolesForTaskTypes(): Promise<Array<{ id: string; name: string }>> {
    const roles = await Role.findAll({
      where: {
        deleted_at: null,
        is_active: true,
      },
      attributes: ['id', 'name'],
      order: [['name', 'ASC']],
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
    }));
  }

  /**
   * Get all roles with filtering and pagination
   */
  static async getAllRoles(
    filters: { name?: string; is_active?: boolean } = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{
    roles: RoleWithStatsDto[];
    meta: ReturnType<typeof getPaginationMeta>;
  }> {
    const { offset, limit: limitNum, page: pageNum } = getPaginationParams(page, limit);

    const where: any = {
      deleted_at: null,
    };

    if (filters.name) {
      where.name = {
        [Op.iLike]: `%${filters.name}%`,
      };
    }

    if (filters.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    const { rows, count } = await Role.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit: limitNum,
      offset,
    });

    // Transform roles with stats
    const roles = await Promise.all(rows.map(transformRoleToStatsDto));

    return {
      roles,
      meta: getPaginationMeta(count, pageNum, limitNum),
    };
  }

  /**
   * Get role by ID with permissions and users
   */
  static async getRoleById(id: string): Promise<RoleResponseDto | null> {
    const role = await Role.findOne({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!role) {
      return null;
    }

    return transformRoleToDto(role);
  }

  /**
   * Create role
   */
  static async createRole(roleData: CreateRoleDto, createdBy?: string): Promise<RoleResponseDto> {
    const transaction = await sequelize.transaction();

    try {
      // Check if role name already exists
      const existingRole = await Role.findOne({
        where: {
          name: roleData.name.toLowerCase(),
          deleted_at: null,
        },
        transaction,
      });

      if (existingRole) {
        await transaction.rollback();
        throw new Error('Role name already exists');
      }

      const role = await Role.create(
        {
          name: roleData.name.toLowerCase(),
          description: roleData.description || null,
          created_by: createdBy || null,
        },
        { transaction }
      );

      await transaction.commit();

      // Fetch role with relations
      const roleWithRelations = await this.getRoleById(role.id);
      if (!roleWithRelations) {
        throw new Error('Failed to retrieve created role');
      }

      return roleWithRelations;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update role
   */
  static async updateRole(
    id: string,
    roleData: UpdateRoleDto,
    updatedBy?: string
  ): Promise<RoleResponseDto> {
    const transaction = await sequelize.transaction();

    try {
      const role = await Role.findOne({
        where: { id, deleted_at: null },
        transaction,
      });

      if (!role) {
        await transaction.rollback();
        throw new Error('Role not found');
      }

      // Check if new name conflicts with existing role
      if (roleData.name && roleData.name.toLowerCase() !== role.name.toLowerCase()) {
        const existingRole = await Role.findOne({
          where: {
            name: roleData.name.toLowerCase(),
            deleted_at: null,
            id: { [Op.ne]: id },
          },
          transaction,
        });

        if (existingRole) {
          await transaction.rollback();
          throw new Error('Role name already exists');
        }
      }

      // Update role fields
      const updateData: any = {};
      if (roleData.name !== undefined) updateData.name = roleData.name.toLowerCase();
      if (roleData.description !== undefined) updateData.description = roleData.description;
      if (roleData.is_active !== undefined) updateData.is_active = roleData.is_active;
      updateData.updated_by = updatedBy || null;

      await role.update(updateData, { transaction });

      await transaction.commit();

      // Fetch updated role with relations
      const updatedRole = await this.getRoleById(id);
      if (!updatedRole) {
        throw new Error('Failed to retrieve updated role');
      }

      return updatedRole;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete role (soft delete)
   * Prevents deletion if role has assigned users
   */
  static async deleteRole(
    id: string,
    deletedBy?: string,
    force: boolean = false
  ): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      const role = await Role.findOne({
        where: { id, deleted_at: null },
        transaction,
      });

      if (!role) {
        await transaction.rollback();
        throw new Error('Role not found');
      }

      // Check if role has assigned users
      const usersCount = await UserRole.count({
        where: {
          role_id: id,
          deleted_at: null,
          is_active: true,
        },
        transaction,
      });

      if (usersCount > 0 && !force) {
        await transaction.rollback();
        throw new Error(
          `Cannot delete role: ${usersCount} user(s) are assigned to this role. Use force=true to delete anyway.`
        );
      }

      // Soft delete role
      await role.update(
        {
          deleted_at: new Date(),
          deleted_by: deletedBy || null,
        },
        { transaction }
      );

      // Soft delete role permissions
      await RolePermission.update(
        {
          deleted_at: new Date(),
          deleted_by: deletedBy || null,
        },
        {
          where: { role_id: id, deleted_at: null },
          transaction,
        }
      );

      // If force delete, also soft delete user roles
      if (force) {
        await UserRole.update(
          {
            deleted_at: new Date(),
            deleted_by: deletedBy || null,
          },
          {
            where: { role_id: id, deleted_at: null },
            transaction,
          }
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Assign permissions to role (bulk)
   */
  static async assignPermissions(
    roleId: string,
    permissionIds: string[],
    createdBy?: string
  ): Promise<PermissionDto[]> {
    const transaction = await sequelize.transaction();

    try {
      // Verify role exists
      const role = await Role.findOne({
        where: { id: roleId, deleted_at: null },
        transaction,
      });

      if (!role) {
        await transaction.rollback();
        throw new Error('Role not found');
      }

      // Verify all permissions exist
      const permissions = await Permission.findAll({
        where: {
          id: { [Op.in]: permissionIds },
          deleted_at: null,
          is_active: true,
        },
        transaction,
      });

      if (permissions.length !== permissionIds.length) {
        await transaction.rollback();
        throw new Error('One or more permissions not found');
      }

      // Get existing role permissions
      const existingRolePermissions = await RolePermission.findAll({
        where: {
          role_id: roleId,
          deleted_at: null,
        },
        transaction,
      });

      const existingPermissionIds = existingRolePermissions.map((rp) => rp.permission_id);

      // Filter out already assigned permissions
      const newPermissionIds = permissionIds.filter(
        (pid) => !existingPermissionIds.includes(pid)
      );

      // Create role permissions
      await Promise.all(
        newPermissionIds.map((permissionId) =>
          RolePermission.create(
            {
              role_id: roleId,
              permission_id: permissionId,
              created_by: createdBy || null,
            },
            { transaction }
          )
        )
      );

      await transaction.commit();

      // Fetch assigned permissions
      const assignedPermissions = await RolePermission.findAll({
        where: {
          role_id: roleId,
          permission_id: { [Op.in]: permissionIds },
          deleted_at: null,
          is_active: true,
        },
        include: [
          {
            model: Permission,
            as: 'permission',
            where: { deleted_at: null, is_active: true },
            required: true,
          },
        ],
      });

      return assignedPermissions
        .map((rp) => (rp as RolePermission & { permission?: Permission }).permission)
        .filter((permission): permission is Permission => permission !== null && permission !== undefined)
        .map((permission) => ({
          id: permission.id,
          resource: permission.resource,
          action: permission.action,
          permission: `${permission.resource}:${permission.action}`,
          is_active: permission.is_active,
          created_at: permission.created_at,
          updated_at: permission.updated_at,
        }));
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Remove permissions from role (bulk)
   */
  static async removePermissions(
    roleId: string,
    permissionIds: string[],
    deletedBy?: string
  ): Promise<void> {
    const transaction = await sequelize.transaction();

    try {
      // Verify role exists
      const role = await Role.findOne({
        where: { id: roleId, deleted_at: null },
        transaction,
      });

      if (!role) {
        await transaction.rollback();
        throw new Error('Role not found');
      }

      // Soft delete role permissions
      await RolePermission.update(
        {
          deleted_at: new Date(),
          deleted_by: deletedBy || null,
        },
        {
          where: {
            role_id: roleId,
            permission_id: { [Op.in]: permissionIds },
            deleted_at: null,
          },
          transaction,
        }
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Get role permissions
   */
  static async getRolePermissions(roleId: string): Promise<PermissionDto[]> {
    const rolePermissions = await RolePermission.findAll({
      where: {
        role_id: roleId,
        deleted_at: null,
        is_active: true,
      },
      include: [
        {
          model: Permission,
          as: 'permission',
          where: { deleted_at: null, is_active: true },
          required: true,
        },
      ],
    });

    return rolePermissions
      .map((rp) => (rp as RolePermission & { permission?: Permission }).permission)
      .filter((permission): permission is Permission => permission !== null && permission !== undefined)
      .map((permission) => ({
        id: permission.id,
        resource: permission.resource,
        action: permission.action,
        permission: `${permission.resource}:${permission.action}`,
        is_active: permission.is_active,
        created_at: permission.created_at,
        updated_at: permission.updated_at,
      }));
  }

  /**
   * Get users with this role
   */
  static async getRoleUsers(roleId: string): Promise<UserWithRoleDto[]> {
    const userRoles = await UserRole.findAll({
      where: {
        role_id: roleId,
        deleted_at: null,
        is_active: true,
      },
      include: [
        {
          model: User,
          as:'user',
          where: { deleted_at: null },
          required: true,
        },
      ],
      order: [['created_at', 'DESC']],
    });

    return userRoles
      .map((ur) => (ur as UserRole & { user?: User }).user)
      .filter((user): user is User => user !== null && user !== undefined)
      .map((user) => ({
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        is_active: user.is_active,
        assigned_at: user.created_at, // Using created_at as assigned_at
      }));
  }

  /**
   * Get users count by role
   */
  static async getUsersCountByRole(roleId: string): Promise<number> {
    return UserRole.count({
      where: {
        role_id: roleId,
        deleted_at: null,
        is_active: true,
      },
    });
  }
}
