import { BaseCreationAttributes } from '../types/database.types';

type AuditAction = 'create' | 'update' | 'delete';

interface AuditData extends Partial<BaseCreationAttributes> {
  [key: string]: unknown;
}

/**
 * Set audit fields based on action type
 */
export const setAuditFields = <T extends AuditData>(
  data: T,
  userId: string | undefined,
  action: AuditAction
): T => {
  const now = new Date();
  const auditFields: Partial<BaseCreationAttributes> = {};

  switch (action) {
    case 'create':
      auditFields.created_by = userId || null;
      auditFields.created_at = now;
      auditFields.updated_by = userId || null;
      auditFields.updated_at = now;
      auditFields.is_active = data.is_active !== undefined ? data.is_active : true;
      break;

    case 'update':
      auditFields.updated_by = userId || null;
      auditFields.updated_at = now;
      break;

    case 'delete':
      auditFields.deleted_by = userId || null;
      auditFields.deleted_at = now;
      break;
  }

  return {
    ...data,
    ...auditFields,
  };
};

/**
 * Set created audit fields
 */
export const setCreatedAuditFields = <T extends AuditData>(
  data: T,
  userId?: string
): T => {
  return setAuditFields(data, userId, 'create');
};

/**
 * Set updated audit fields
 */
export const setUpdatedAuditFields = <T extends AuditData>(
  data: T,
  userId?: string
): T => {
  return setAuditFields(data, userId, 'update');
};

/**
 * Set deleted audit fields
 */
export const setDeletedAuditFields = <T extends AuditData>(
  data: T,
  userId?: string
): T => {
  return setAuditFields(data, userId, 'delete');
};
