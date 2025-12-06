import { create } from 'zustand';
import api from '@/lib/api';
import {
  Project,
  CreateProjectRequest,
  CreateProjectResponse,
  ProjectsResponse,
  TestConnectionResponse,
  MySQLConfig,
} from '@/types/project';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;

  // Actions
  fetchProjects: () => Promise<void>;
  createProject: (data: CreateProjectRequest) => Promise<CreateProjectResponse>;
  testMySQLConnection: (config: MySQLConfig) => Promise<TestConnectionResponse>;
  deleteProject: (id: string) => Promise<{ success: boolean; message: string }>;
  setCurrentProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,

  fetchProjects: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get<ProjectsResponse>('/projects');
      if (response.data.success && response.data.data) {
        set({ projects: response.data.data.projects });
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createProject: async (data: CreateProjectRequest): Promise<CreateProjectResponse> => {
    set({ isLoading: true });
    try {
      const response = await api.post<CreateProjectResponse>('/projects', data);
      
      if (response.data.success && response.data.data) {
        const newProject = response.data.data.project;
        set((state) => ({
          projects: [newProject, ...state.projects],
        }));
      }
      
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: CreateProjectResponse } };
        return axiosError.response?.data || {
          success: false,
          message: 'Failed to create project',
        };
      }
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    } finally {
      set({ isLoading: false });
    }
  },

  testMySQLConnection: async (config: MySQLConfig): Promise<TestConnectionResponse> => {
    try {
      const response = await api.post<TestConnectionResponse>('/projects/test-mysql', config);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: TestConnectionResponse } };
        return axiosError.response?.data || {
          success: false,
          message: 'Failed to test connection',
        };
      }
      return {
        success: false,
        message: 'Network error. Please check your connection.',
      };
    }
  },

  deleteProject: async (id: string) => {
    try {
      const response = await api.delete(`/projects/${id}`);
      if (response.data.success) {
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        }));
      }
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { success: boolean; message: string } } };
        return axiosError.response?.data || {
          success: false,
          message: 'Failed to delete project',
        };
      }
      return {
        success: false,
        message: 'Network error',
      };
    }
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },
}));
