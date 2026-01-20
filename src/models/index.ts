import sequelize from '../config/database';
import { User } from './User.model';
import { ContactType } from './ContactType.model';
import { UserContact } from './UserContact.model';
import { UserPassword } from './UserPassword.model';
import { Role } from './Role.model';
import { UserRole } from './UserRole.model';
import { Permission } from './Permission.model';
import { RolePermission } from './RolePermission.model';
import { RefreshToken } from './RefreshToken.model';
import { PasswordResetToken } from './PasswordResetToken.model';
import { UserVerificationToken } from './UserVerificationToken.model';
import { Project } from './Project.model';
import { Task } from './Task.model';
import { TaskAssignment } from './TaskAssignment.model';
import { TaskUpdate } from './TaskUpdate.model';

// Initialize all models
User.initialize(sequelize);
ContactType.initialize(sequelize);
UserContact.initialize(sequelize);
UserPassword.initialize(sequelize);
Role.initialize(sequelize);
UserRole.initialize(sequelize);
Permission.initialize(sequelize);
RolePermission.initialize(sequelize);
RefreshToken.initialize(sequelize);
PasswordResetToken.initialize(sequelize);
UserVerificationToken.initialize(sequelize);
Project.initialize(sequelize);
Task.initialize(sequelize);
TaskAssignment.initialize(sequelize);
TaskUpdate.initialize(sequelize);

// Define associations

// User associations
User.hasMany(UserContact, {
  foreignKey: 'user_id',
  as: 'contacts',
  onDelete: 'CASCADE',
});

User.hasMany(UserPassword, {
  foreignKey: 'user_id',
  as: 'passwords',
  onDelete: 'CASCADE',
});

User.hasMany(UserRole, {
  foreignKey: 'user_id',
  as: 'userRoles',
  onDelete: 'CASCADE',
});

User.hasMany(RefreshToken, {
  foreignKey: 'user_id',
  as: 'refreshTokens',
  onDelete: 'CASCADE',
});

User.hasMany(PasswordResetToken, {
  foreignKey: 'user_id',
  as: 'passwordResetTokens',
  onDelete: 'CASCADE',
});

User.hasMany(UserVerificationToken, {
  foreignKey: 'user_id',
  as: 'verificationTokens',
  onDelete: 'CASCADE',
});

User.hasMany(Project, {
  foreignKey: 'created_by',
  as: 'createdProjects',
  onDelete: 'RESTRICT',
});

User.hasMany(Task, {
  foreignKey: 'created_by',
  as: 'createdTasks',
  onDelete: 'RESTRICT',
});

User.hasMany(TaskAssignment, {
  foreignKey: 'user_id',
  as: 'taskAssignments',
  onDelete: 'CASCADE',
});

User.hasMany(TaskAssignment, {
  foreignKey: 'assigned_by',
  as: 'assignedTasks',
  onDelete: 'RESTRICT',
});

User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: 'user_id',
  otherKey: 'role_id',
  as: 'roles',
});

// ContactType associations
ContactType.hasMany(UserContact, {
  foreignKey: 'contact_type_id',
  as: 'userContacts',
  onDelete: 'RESTRICT',
});

UserContact.belongsTo(User, {
  foreignKey: 'user_id',
  as:'user',
});

UserContact.belongsTo(ContactType, {
  foreignKey: 'contact_type_id',
  as: 'contactType',
});

// UserPassword associations
UserPassword.belongsTo(User, {
  foreignKey: 'user_id',
  as:'user',
});

// Role associations
Role.hasMany(UserRole, {
  foreignKey: 'role_id',
  as: 'userRoles',
  onDelete: 'RESTRICT',
});

Role.hasMany(RolePermission, {
  foreignKey: 'role_id',
  as: 'rolePermissions',
  onDelete: 'CASCADE',
});

Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: 'role_id',
  otherKey: 'user_id',
  as: 'users',
});

Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions',
});

// UserRole associations
UserRole.belongsTo(User, {
  foreignKey: 'user_id',
  as:'user',
});

UserRole.belongsTo(Role, {
  foreignKey: 'role_id',
  as: 'role',
});

// Permission associations
Permission.hasMany(RolePermission, {
  foreignKey: 'permission_id',
  as: 'rolePermissions',
  onDelete: 'CASCADE',
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles',
});

// RolePermission associations
RolePermission.belongsTo(Role, {
  foreignKey: 'role_id',
  as: 'role',
});

RolePermission.belongsTo(Permission, {
  foreignKey: 'permission_id',
  as: 'permission',
});

// RefreshToken associations
RefreshToken.belongsTo(User, {
  foreignKey: 'user_id',
  as:'user',
});

// PasswordResetToken associations
PasswordResetToken.belongsTo(User, {
  foreignKey: 'user_id',
  as:'user',
});

// UserVerificationToken associations
UserVerificationToken.belongsTo(User, {
  foreignKey: 'user_id',
  as:'user',
});

// Project associations
Project.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});
Project.belongsTo(User, {
  foreignKey: 'project_manager_id',
  as: 'projectManager',
});

Project.hasMany(Task, {
  foreignKey: 'project_id',
  as: 'tasks',
  onDelete: 'CASCADE',
});

// Task associations
Task.belongsTo(Project, {
  foreignKey: 'project_id',
  as: 'project',
});

Task.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'creator',
});

Task.hasMany(TaskAssignment, {
  foreignKey: 'task_id',
  as: 'assignments',
  onDelete: 'CASCADE',
});

// TaskAssignment associations
TaskAssignment.belongsTo(Task, {
  foreignKey: 'task_id',
  as: 'task',
});

TaskAssignment.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
});

TaskAssignment.belongsTo(User, {
  foreignKey: 'assigned_by',
  as: 'assigner',
});

// TaskUpdate associations
Task.hasMany(TaskUpdate, {
  foreignKey: 'task_id',
  as: 'updates',
  onDelete: 'CASCADE',
});

TaskUpdate.belongsTo(Task, {
  foreignKey: 'task_id',
  as: 'task',
});

TaskUpdate.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'updater',
});

User.hasMany(TaskUpdate, {
  foreignKey: 'updated_by',
  as: 'taskUpdates',
  onDelete: 'RESTRICT',
});

// Export models and sequelize instance
export {
  sequelize,
  User,
  ContactType,
  UserContact,
  UserPassword,
  Role,
  UserRole,
  Permission,
  RolePermission,
  RefreshToken,
  PasswordResetToken,
  UserVerificationToken,
  Project,
  Task,
  TaskAssignment,
  TaskUpdate,
};

export default sequelize;
