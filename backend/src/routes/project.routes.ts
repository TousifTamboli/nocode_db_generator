import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProject,
  deleteProject,
  testMySQLConnectionEndpoint,
} from '../controllers/project.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes are protected
router.use(authenticate);

// Test MySQL connection
router.post('/test-mysql', testMySQLConnectionEndpoint);

// Project CRUD
router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.delete('/:id', deleteProject);

export default router;
