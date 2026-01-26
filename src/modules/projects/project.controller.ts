import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware";
import { ProjectService } from "./project.service";
import {
  createProjectSchema,
  updateProjectSchema,
  getProjectsQuerySchema,
  getProjectsListQuerySchema,
} from "./project.validation";
import { CreateProjectDto, UpdateProjectDto, ProjectFilters } from "./project.types";
import { success, error, paginated } from "../../utils/response.util";

/**
 * Project Controller - Handles HTTP requests for project management
 */
export class ProjectController {
  /**
   * Get all projects
   */
  static async getProjects(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const query = getProjectsQuerySchema.parse(req.query);

      const filters: ProjectFilters = {};

      // Handle search parameter (searches in name)
      if (query.search) {
        filters.name = query.search;
      }

      if (query.name) filters.name = query.name;
      if (query.created_by) filters.created_by = query.created_by;
      if (query.is_active !== undefined) filters.is_active = query.is_active;
      if (query.start_date_from) filters.start_date_from = query.start_date_from;
      if (query.start_date_to) filters.start_date_to = query.start_date_to;
      if (query.end_date_from) filters.end_date_from = query.end_date_from;
      if (query.end_date_to) filters.end_date_to = query.end_date_to;

      const sortField = query.sort_field;
      const sortOrder = query.sort_order || "ASC";

      const result = await ProjectService.getAllProjects(
        filters,
        query.page || 1,
        query.limit || 10,
        sortField,
        sortOrder,
      );

      paginated(res, result.projects, result.meta, "Projects retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get project by ID
   */
  static async getProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          message: "Project id is required",
        });
        return;
      }

      const project = await ProjectService.getProjectById(id);

      if (!project) {
        error(res, "Project not found", 404);
        return;
      }

      success(res, project, "Project retrieved successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create new project
   */
  static async createProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate request body
      const validatedData = createProjectSchema.parse(req.body) as CreateProjectDto;

      // Get current user ID
      const createdBy = req.user!.id;

      const project = await ProjectService.createProject(validatedData, createdBy);

      success(res, project, "Project created successfully", 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update project
   */
  static async updateProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: "Project id is required" });
        return;
      }

      // Validate request body
      const validatedData = updateProjectSchema.parse(req.body) as UpdateProjectDto;

      // Get current user ID
      const updatedBy = req.user!.id;

      const project = await ProjectService.updateProject(id, validatedData, updatedBy);

      if (!project) {
        error(res, "Project not found", 404);
        return;
      }

      success(res, project, "Project updated successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete project
   */
  static async deleteProject(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({ message: "Project id is required" });
        return;
      }
      const deletedBy = req.user!.id;

      const deleted = await ProjectService.deleteProject(id, deletedBy);

      if (!deleted) {
        error(res, "Project not found", 404);
        return;
      }

      success(res, null, "Project deleted successfully");
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get simplified list of projects (for dropdowns, etc.)
   * No permission required - only authentication
   */
  static async getProjectsList(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Validate query parameters
      const query = getProjectsListQuerySchema.parse(req.query);

      const filters: { is_active?: boolean } = {};
      if (query.is_active !== undefined) {
        filters.is_active = query.is_active;
      }

      const projects = await ProjectService.getProjectsList(filters);

      success(res, projects, "Projects list retrieved successfully");
    } catch (err) {
      next(err);
    }
  }
}
