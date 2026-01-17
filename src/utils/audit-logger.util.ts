import { smartLogger } from './logger.util';

/**
 * Audit Logger - Always enabled for security/compliance events
 */
export class AuditLogger {
  /**
   * Log authentication success
   */
  static authSuccess = (userId: string, contact: string, ip: string): void => {
    smartLogger.audit('Authentication success', {
      event: 'auth_success',
      userId,
      contact,
      ip,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Log authentication failure
   */
  static authFailure = (contact: string, reason: string, ip: string): void => {
    smartLogger.audit('Authentication failure', {
      event: 'auth_failure',
      contact,
      reason,
      ip,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Log role change
   */
  static roleChange = (
    userId: string,
    roleId: string,
    action: 'assign' | 'remove',
    performedBy: string
  ): void => {
    smartLogger.audit('Role change', {
      event: 'role_change',
      userId,
      roleId,
      action,
      performedBy,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Log permission change
   */
  static permissionChange = (
    roleId: string,
    permissionId: string,
    action: 'assign' | 'remove',
    performedBy: string
  ): void => {
    smartLogger.audit('Permission change', {
      event: 'permission_change',
      roleId,
      permissionId,
      action,
      performedBy,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Log user creation
   */
  static userCreated = (userId: string, createdBy: string): void => {
    smartLogger.audit('User created', {
      event: 'user_created',
      userId,
      createdBy,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Log user deletion
   */
  static userDeleted = (userId: string, deletedBy: string): void => {
    smartLogger.audit('User deleted', {
      event: 'user_deleted',
      userId,
      deletedBy,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Log password change
   */
  static passwordChanged = (userId: string, changedBy: string): void => {
    smartLogger.audit('Password changed', {
      event: 'password_changed',
      userId,
      changedBy,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Log contact added
   */
  static contactAdded = (
    userId: string,
    contactType: string,
    contact: string,
    addedBy: string
  ): void => {
    smartLogger.audit('Contact added', {
      event: 'contact_added',
      userId,
      contactType,
      contact,
      addedBy,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Log authorization failure
   */
  static authorizationFailure = (
    userId: string,
    resource: string,
    action: string,
    ip: string
  ): void => {
    smartLogger.audit('Authorization failure', {
      event: 'authorization_failure',
      userId,
      resource,
      action,
      ip,
      timestamp: new Date().toISOString(),
    });
  };

  /**
   * Log security event
   */
  static securityEvent = (event: string, data: Record<string, unknown>): void => {
    smartLogger.audit(`Security event: ${event}`, {
      event: 'security_event',
      securityEvent: event,
      ...data,
      timestamp: new Date().toISOString(),
    });
  };
}
