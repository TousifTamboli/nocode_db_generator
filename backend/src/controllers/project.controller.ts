import { Request, Response } from 'express';
import Project from '../models/Project.model';
import { testMySQLConnection, createMySQLDatabase, syncSchemaToMySQL } from '../services/mysql.service';
import { AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

// Validation schemas
const mysqlConfigSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().min(1).max(65535).default(3306),
  user: z.string().min(1, 'Username is required'),
  password: z.string(),
});

const createProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(100),
  databaseType: z.enum(['mysql', 'mongodb']),
  databaseName: z.string().min(1, 'Database name is required').max(64),
  mysqlConfig: mysqlConfigSchema.optional(),
});

const testConnectionSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.number().min(1).max(65535).default(3306),
  user: z.string().min(1, 'Username is required'),
  password: z.string(),
});

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validationResult = createProjectSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.issues,
      });
      return;
    }

    const { name, databaseType, databaseName, mysqlConfig } = validationResult.data;
    const userId = req.userId;

    // Check if project with same name exists for this user
    const existingProject = await Project.findOne({ userId, name });
    if (existingProject) {
      res.status(400).json({
        success: false,
        message: 'A project with this name already exists',
      });
      return;
    }

    // For MySQL, create the database
    if (databaseType === 'mysql' && mysqlConfig) {
      // First test the connection
      const testResult = await testMySQLConnection(mysqlConfig);
      if (!testResult.success) {
        res.status(400).json({
          success: false,
          message: `MySQL connection failed: ${testResult.message}`,
        });
        return;
      }

      // Create the database
      const createResult = await createMySQLDatabase(mysqlConfig, databaseName);
      if (!createResult.success) {
        res.status(400).json({
          success: false,
          message: createResult.message,
        });
        return;
      }
    }

    // Create the project in our database
    const project = await Project.create({
      name,
      databaseType,
      databaseName,
      userId,
      mysqlConfig: databaseType === 'mysql' ? mysqlConfig : undefined,
      schemaData: { tables: [] },
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: {
        project: {
          id: project._id,
          name: project.name,
          databaseType: project.databaseType,
          databaseName: project.databaseName,
          createdAt: project.createdAt,
        },
      },
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating project',
    });
  }
};

// @desc    Test MySQL connection
// @route   POST /api/projects/test-mysql
// @access  Private
export const testMySQLConnectionEndpoint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const validationResult = testConnectionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationResult.error.issues,
      });
      return;
    }

    const config = validationResult.data;
    const result = await testMySQLConnection(config);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Connection successful',
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error('Test connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while testing connection',
    });
  }
};

// @desc    Get all projects for current user
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    
    const projects = await Project.find({ userId })
      .select('-mysqlConfig.password -mongoConfig')
      .sort({ updatedAt: -1 });

    // Transform _id to id for frontend compatibility
    const transformedProjects = projects.map(project => ({
      id: project._id.toString(),
      name: project.name,
      databaseType: project.databaseType,
      databaseName: project.databaseName,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }));

    res.status(200).json({
      success: true,
      data: { projects: transformedProjects },
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching projects',
    });
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Private
export const getProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const project = await Project.findOne({ _id: id, userId });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
      });
      return;
    }

    // Transform for frontend compatibility
    const transformedProject = {
      id: project._id.toString(),
      name: project.name,
      databaseType: project.databaseType,
      databaseName: project.databaseName,
      schemaData: project.schemaData,
      mysqlConfig: project.mysqlConfig ? {
        host: project.mysqlConfig.host,
        port: project.mysqlConfig.port,
        user: project.mysqlConfig.user,
        // Don't send password to frontend
      } : undefined,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };

    res.status(200).json({
      success: true,
      data: { project: transformedProject },
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching project',
    });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private
export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    
    const project = await Project.findOneAndDelete({ _id: id, userId });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting project',
    });
  }
};

// @desc    Update project schema (tables/columns) and sync to MySQL
// @route   PUT /api/projects/:id/schema
// @access  Private
export const updateSchema = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { tables, relationships = [] } = req.body;

    if (!Array.isArray(tables)) {
      res.status(400).json({
        success: false,
        message: 'Tables must be an array',
      });
      return;
    }

    // First, get the project to get MySQL config
    const project = await Project.findOne({ _id: id, userId });

    if (!project) {
      res.status(404).json({
        success: false,
        message: 'Project not found',
      });
      return;
    }

    // Sync to MySQL if it's a MySQL project
    if (project.databaseType === 'mysql' && project.mysqlConfig) {
      console.log('📊 Syncing to MySQL...');
      console.log('📊 Tables to sync:', tables.length);
      console.log('📊 Relationships to sync:', relationships.length);
      console.log('📊 Database:', project.databaseName);
      
      const syncResult = await syncSchemaToMySQL(
        {
          host: project.mysqlConfig.host,
          port: project.mysqlConfig.port,
          user: project.mysqlConfig.user,
          password: project.mysqlConfig.password,
        },
        project.databaseName,
        tables,
        relationships
      );

      if (!syncResult.success) {
        console.error('❌ MySQL sync failed:', syncResult.message);
        console.error('❌ Details:', syncResult.details);
      } else {
        console.log('✅ MySQL sync success:', syncResult.details);
      }
    } else {
      console.log('⚠️ Skipping MySQL sync - not a MySQL project or no config');
      console.log('⚠️ Database type:', project.databaseType);
      console.log('⚠️ Has MySQL config:', !!project.mysqlConfig);
    }

    // Update schema in MongoDB (includes relationships)
    project.schemaData = { tables, relationships };
    await project.save();

    res.status(200).json({
      success: true,
      message: 'Schema updated and synced to MySQL',
    });
  } catch (error) {
    console.error('Update schema error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating schema',
    });
  }
};

