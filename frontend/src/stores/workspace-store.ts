import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import api from '@/lib/api';

export interface Column {
  id: string;
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  defaultValue?: string;
}

export interface Table {
  id: string;
  name: string;
  position: { x: number; y: number };
  columns: Column[];
}

interface WorkspaceState {
  projectId: string | null;
  projectName: string;
  databaseName: string;
  tables: Table[];
  selectedTableId: string | null;
  isSaving: boolean;
  
  // Actions
  setProject: (projectId: string, projectName: string, databaseName: string) => void;
  addTable: (name: string, position: { x: number; y: number }) => string;
  updateTableName: (tableId: string, name: string) => void;
  updateTablePosition: (tableId: string, position: { x: number; y: number }) => void;
  deleteTable: (tableId: string) => void;
  addColumn: (tableId: string, column: Omit<Column, 'id'>) => void;
  updateColumn: (tableId: string, columnId: string, updates: Partial<Column>) => void;
  deleteColumn: (tableId: string, columnId: string) => void;
  selectTable: (tableId: string | null) => void;
  setTables: (tables: Table[]) => void;
  saveSchema: () => Promise<void>;
}

// Debounce timer for auto-save
let saveTimeout: NodeJS.Timeout | null = null;

const debouncedSave = (saveFunction: () => Promise<void>) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveFunction();
  }, 1000); // Save 1 second after last change
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  projectId: null,
  projectName: '',
  databaseName: '',
  tables: [],
  selectedTableId: null,
  isSaving: false,

  setProject: (projectId, projectName, databaseName) => {
    set({ projectId, projectName, databaseName, tables: [], selectedTableId: null });
  },

  saveSchema: async () => {
    const { projectId, tables } = get();
    if (!projectId) return;

    set({ isSaving: true });
    try {
      await api.put(`/projects/${projectId}/schema`, { tables });
      console.log('Schema saved successfully');
    } catch (error) {
      console.error('Failed to save schema:', error);
    } finally {
      set({ isSaving: false });
    }
  },

  addTable: (name, position) => {
    const id = uuidv4();
    const newTable: Table = {
      id,
      name,
      position,
      columns: [],
    };
    set((state) => ({ tables: [...state.tables, newTable] }));
    
    // Auto-save after changes
    debouncedSave(get().saveSchema);
    
    return id;
  },

  updateTableName: (tableId, name) => {
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === tableId ? { ...table, name } : table
      ),
    }));
    debouncedSave(get().saveSchema);
  },

  updateTablePosition: (tableId, position) => {
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === tableId ? { ...table, position } : table
      ),
    }));
    debouncedSave(get().saveSchema);
  },

  deleteTable: (tableId) => {
    set((state) => ({
      tables: state.tables.filter((table) => table.id !== tableId),
      selectedTableId: state.selectedTableId === tableId ? null : state.selectedTableId,
    }));
    debouncedSave(get().saveSchema);
  },

  addColumn: (tableId, column) => {
    const id = uuidv4();
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === tableId
          ? { ...table, columns: [...table.columns, { ...column, id }] }
          : table
      ),
    }));
    debouncedSave(get().saveSchema);
  },

  updateColumn: (tableId, columnId, updates) => {
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === tableId
          ? {
              ...table,
              columns: table.columns.map((col) =>
                col.id === columnId ? { ...col, ...updates } : col
              ),
            }
          : table
      ),
    }));
    debouncedSave(get().saveSchema);
  },

  deleteColumn: (tableId, columnId) => {
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === tableId
          ? { ...table, columns: table.columns.filter((col) => col.id !== columnId) }
          : table
      ),
    }));
    debouncedSave(get().saveSchema);
  },

  selectTable: (tableId) => {
    set({ selectedTableId: tableId });
  },

  setTables: (tables) => {
    set({ tables });
  },
}));
