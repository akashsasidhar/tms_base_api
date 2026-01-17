import { Op, WhereOptions, Order, Includeable } from 'sequelize';
import { UserContact, UserRole, Role, ContactType } from '../models';

export interface UserFilters {
  username?: string;
  first_name?: string;
  last_name?: string;
  role_id?: string;
  is_active?: boolean;
  contact?: string;
}

export interface SortOptions {
  field?: string;
  order?: 'ASC' | 'DESC';
}

/**
 * Build WHERE clause for user queries
 */
export function buildUserWhereClause(filters: UserFilters): WhereOptions {
  const where: WhereOptions = {};

  if (filters.username) {
    where['username'] = {
      [Op.iLike]: `%${filters.username}%`,
    };
  }

  if (filters.first_name) {
    where['first_name'] = {
      [Op.iLike]: `%${filters.first_name}%`,
    };
  }

  if (filters.last_name) {
    where['last_name'] = {
      [Op.iLike]: `%${filters.last_name}%`,
    };
  }

  if (filters.is_active !== undefined) {
    where['is_active'] = filters.is_active;
  }

  return where;
}

/**
 * Build ORDER clause for user queries
 */
export function buildUserOrderClause(sort?: SortOptions): Order {
  if (!sort || !sort.field) {
    return [['created_at', 'DESC']];
  }

  const allowedFields = [
    'username',
    'first_name',
    'last_name',
    'created_at',
    'updated_at',
    'is_active',
  ];

  const field = allowedFields.includes(sort.field) ? sort.field : 'created_at';
  const order = sort.order === 'ASC' ? 'ASC' : 'DESC';

  return [[field, order]];
}

/**
 * Build includes for user queries (contacts and roles)
 */
export function buildUserIncludes(): Includeable[] {
  return [
    {
      model: UserContact,
      as: 'contacts',
      required: false,
      where: {
        deleted_at: null,
      },
      include: [
        {
          model: ContactType,
          as: 'contactType',
          required: false,
        },
      ],
    },
    {
      model: UserRole,
      as: 'userRoles',
      required: false,
      where: {
        deleted_at: null,
        is_active: true,
      },
      include: [
        {
          model: Role,
          as: 'role',
          required: false,
          where: {
            deleted_at: null,
            is_active: true,
          },
        },
      ],
    },
  ];
}

/**
 * Build WHERE clause with contact filter
 * This requires a subquery or join
 */
export function buildUserWhereWithContact(
  filters: UserFilters,
  includeContactFilter: boolean = false
): {
  where: WhereOptions;
  include: Includeable[];
} {
  const where = buildUserWhereClause(filters);
  const include = buildUserIncludes();

  // If filtering by contact, we need to add a condition to the UserContact include
  if (includeContactFilter && filters.contact) {
    const contactIncludeIndex = include.findIndex((inc) => {
      if (typeof inc === 'string') return false;
      return (inc as { as?: string })['as'] === 'contacts';
    });
    
    if (contactIncludeIndex !== -1) {
      const contactInclude = include[contactIncludeIndex] as {
        where?: WhereOptions;
        required?: boolean;
      };
      contactInclude.where = {
        ...contactInclude.where,
        contact: {
          [Op.iLike]: `%${filters.contact}%`,
        },
      };
      contactInclude.required = true; // Make it an INNER JOIN
    }
  }

  // If filtering by role_id, add condition to UserRole include
  if (filters.role_id) {
    const roleIncludeIndex = include.findIndex((inc) => {
      if (typeof inc === 'string') return false;
      return (inc as { as?: string })['as'] === 'userRoles';
    });
    
    if (roleIncludeIndex !== -1) {
      const roleInclude = include[roleIncludeIndex] as {
        where?: WhereOptions;
        required?: boolean;
      };
      roleInclude.where = {
        ...roleInclude.where,
        role_id: filters.role_id,
      };
      roleInclude.required = true; // Make it an INNER JOIN
    }
  }

  return { where, include };
}
