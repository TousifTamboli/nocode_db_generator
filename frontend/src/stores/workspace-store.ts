import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import api from '@/lib/api';

export interface Column {
  id: string;
  name: string;
  type: string;
  isPrimaryKey: boolean;
  isNullable: boolean;
  isUnique: boolean;
  isAutoIncrement: boolean;
  defaultValue?: string;
  checkConstraint?: string;
}

export interface Table {
  id: string;
  name: string;
  position: { x: number; y: number };
  columns: Column[];
}

// Foreign key relationship between tables
export interface Relationship {
  id: string;
  sourceTableId: string;
  sourceColumnId: string;
  targetTableId: string;
  targetColumnId: string;
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

interface WorkspaceState {
  projectId: string | null;
  projectName: string;
  databaseName: string;
  tables: Table[];
  relationships: Relationship[];
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
  
  // Relationship actions
  addRelationship: (relationship: Omit<Relationship, 'id'>) => void;
  deleteRelationship: (relationshipId: string) => void;
  setRelationships: (relationships: Relationship[]) => void;
  
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
  }, 1000);
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  projectId: null,
  projectName: '',
  databaseName: '',
  tables: [],
  relationships: [],
  selectedTableId: null,
  isSaving: false,

  setProject: (projectId, projectName, databaseName) => {
    set({ projectId, projectName, databaseName, tables: [], relationships: [], selectedTableId: null });
  },

  saveSchema: async () => {
    const { projectId, tables, relationships } = get();
    if (!projectId) return;

    set({ isSaving: true });
    try {
      await api.put(`/projects/${projectId}/schema`, { tables, relationships });
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
      // Also remove relationships involving this table
      relationships: state.relationships.filter(
        (rel) => rel.sourceTableId !== tableId && rel.targetTableId !== tableId
      ),
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
      // Also remove relationships involving this column
      relationships: state.relationships.filter(
        (rel) => rel.sourceColumnId !== columnId && rel.targetColumnId !== columnId
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

  // Relationship actions
  addRelationship: (relationship) => {
    const id = uuidv4();
    // Check if relationship already exists
    const { relationships } = get();
    const exists = relationships.some(
      (rel) =>
        rel.sourceTableId === relationship.sourceTableId &&
        rel.sourceColumnId === relationship.sourceColumnId &&
        rel.targetTableId === relationship.targetTableId &&
        rel.targetColumnId === relationship.targetColumnId
    );
    
    if (!exists) {
      set((state) => ({
        relationships: [...state.relationships, { ...relationship, id }],
      }));
      debouncedSave(get().saveSchema);
    }
  },

  deleteRelationship: (relationshipId) => {
    set((state) => ({
      relationships: state.relationships.filter((rel) => rel.id !== relationshipId),
    }));
    debouncedSave(get().saveSchema);
  },

  setRelationships: (relationships) => {
    set({ relationships });
  },
}));
