export type DatabaseType = 'mysql' | 'mongodb';

export interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password: string;
}

export interface Project {
  id: string;
  name: string;
  databaseType: DatabaseType;
  databaseName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  name: string;
  databaseType: DatabaseType;
  databaseName: string;
  mysqlConfig?: MySQLConfig;
}

export interface ProjectsResponse {
  success: boolean;
  data?: {
    projects: Project[];
  };
  message?: string;
}

export interface CreateProjectResponse {
  success: boolean;
  message: string;
  data?: {
    project: Project;
  };
  errors?: Array<{
    message: string;
    path: string[];
  }>;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
}
