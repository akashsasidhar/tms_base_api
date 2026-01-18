import { Op } from 'sequelize';
import { Project, User } from '../../models';
import { getPaginationParams, getPaginationMeta } from '../../helpers/pagination.helper';
import {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectResponseDto,
  ProjectFilters,
} from './project.types';

/**
 * Transform project model to response DTO
 */
function transformProjectToDto(project: Project): ProjectResponseDto {
  const projectWithIncludes = project as Project & {
    creator?: User;
  };

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    created_by: project.created_by,
    start_date: project.start_date,
    end_date: project.end_date,
    is_active: project.is_active,
    created_at: project.created_at,
    updated_at: project.updated_at,
    created_by_user: projectWithIncludes.creator
      ? {
          id: projectWithIncludes.creator.id,
          username: projectWithIncludes.creator.username,
          first_name: projectWithIncludes.creator.first_name,
          last_name: projectWithIncludes.creator.last_name,
        }
      : null,
  };
}

/**
 * Project Service - Handles all project management business logic
 */
export class ProjectService {
  /**
   * Get all projects with filtering, pagination, and sorting
   */
  static async getAllProjects(
    filters: ProjectFilters = {},
    page: number = 1,
    limit: number = 10,
    sortField?: string,
    sortOrder: 'ASC' | 'DESC' = 'ASC'
  ): Promise<{
    projects: ProjectResponseDto[];
    meta: ReturnType<typeof getPaginationMeta>;
  }> {
    const { offset, limit: limitNum, page: pageNum } = getPaginationParams(page, limit);

    // Build where clause
    const where: any = {
      deleted_at: null,
    };

    if (filters.name) {
      where.name = {
        [Op.iLike]: `%${filters.name}%`,
      };
    }

    if (filters.created_by) {
      where.created_by = filters.created_by;
    }

    if (filters.is_active !== undefined) {
      where.is_active = filters.is_active;
    }

    if (filters.start_date_from || filters.start_date_to) {
      where.start_date = {};
      if (filters.start_date_from) {
        where.start_date[Op.gte] = filters.start_date_from;
      }
      if (filters.start_date_to) {
        where.start_date[Op.lte] = filters.start_date_to;
      }
    }

    if (filters.end_date_from || filters.end_date_to) {
      where.end_date = {};
      if (filters.end_date_from) {
        where.end_date[Op.gte] = filters.end_date_from;
      }
      if (filters.end_date_to) {
        where.end_date[Op.lte] = filters.end_date_to;
      }
    }

    // Build order clause
    const order: any[] = [];
    if (sortField) {
      order.push([sortField, sortOrder]);
    } else {
      order.push(['created_at', 'DESC']); // Default sort
    }

    // Execute query
    const { rows, count } = await Project.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'first_name', 'last_name'],
          required: false,
        },
      ],
      limit: limitNum,
      offset,
      order,
    });

    const projects = rows.map(transformProjectToDto);
    const meta = getPaginationMeta(count, pageNum, limitNum);

    return { projects, meta };
  }

  /**
   * Get project by ID
   */
  static async getProjectById(id: string): Promise<ProjectResponseDto | null> {
    const project = await Project.findOne({
      where: {
        id,
        deleted_at: null,
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'first_name', 'last_name'],
          required: false,
        },
      ],
    });

    if (!project) {
      return null;
    }

    return transformProjectToDto(project);
  }

  /**
   * Create new project
   */
  static async createProject(
    data: CreateProjectDto,
    createdBy: string
  ): Promise<ProjectResponseDto> {
    const project = await Project.create({
      name: data.name,
      description: data.description || null,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      created_by: createdBy,
      is_active: true,
    });

    // Reload with associations
    await project.reload({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'first_name', 'last_name'],
          required: false,
        },
      ],
    });

    return transformProjectToDto(project);
  }

  /**
   * Update project
   */
  static async updateProject(
    id: string,
    data: UpdateProjectDto,
    updatedBy?: string
  ): Promise<ProjectResponseDto | null> {
    const project = await Project.findOne({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!project) {
      return null;
    }

    // Update fields
    if (data.name !== undefined) {
      project.name = data.name;
    }
    if (data.description !== undefined) {
      project.description = data.description;
    }
    if (data.start_date !== undefined) {
      project.start_date = data.start_date;
    }
    if (data.end_date !== undefined) {
      project.end_date = data.end_date;
    }
    if (data.is_active !== undefined) {
      project.is_active = data.is_active;
    }
    if (updatedBy) {
      project.updated_by = updatedBy;
    }

    await project.save();

    // Reload with associations
    await project.reload({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'first_name', 'last_name'],
          required: false,
        },
      ],
    });

    return transformProjectToDto(project);
  }

  /**
   * Delete project (soft delete)
   */
  static async deleteProject(id: string, deletedBy: string): Promise<boolean> {
    const project = await Project.findOne({
      where: {
        id,
        deleted_at: null,
      },
    });

    if (!project) {
      return false;
    }

    await project.softDelete(deletedBy);
    return true;
  }
}
