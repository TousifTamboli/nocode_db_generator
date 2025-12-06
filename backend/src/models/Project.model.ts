import mongoose, { Document, Schema } from 'mongoose';

export type DatabaseType = 'mysql' | 'mongodb';

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  databaseType: DatabaseType;
  databaseName: string;
  userId: mongoose.Types.ObjectId;
  // MySQL connection details (stored temporarily, encrypted in production)
  mysqlConfig?: {
    host: string;
    port: number;
    user: string;
    password: string;
  };
  // MongoDB connection details
  mongoConfig?: {
    uri: string;
  };
  // Schema data (tables/collections and their structure)
  schemaData: {
    tables: Array<{
      id: string;
      name: string;
      position: { x: number; y: number };
      columns: Array<{
        id: string;
        name: string;
        type: string;
        isPrimaryKey: boolean;
        isNullable: boolean;
        isUnique?: boolean;
        isAutoIncrement?: boolean;
        defaultValue?: string;
        checkConstraint?: string;
      }>;
    }>;
    relationships?: Array<{
      id: string;
      sourceTableId: string;
      sourceColumnId: string;
      targetTableId: string;
      targetColumnId: string;
      onDelete?: string;
      onUpdate?: string;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters'],
      maxlength: [100, 'Project name cannot exceed 100 characters'],
    },
    databaseType: {
      type: String,
      enum: ['mysql', 'mongodb'],
      required: [true, 'Database type is required'],
    },
    databaseName: {
      type: String,
      required: [true, 'Database name is required'],
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mysqlConfig: {
      host: String,
      port: Number,
      user: String,
      password: String,
    },
    mongoConfig: {
      uri: String,
    },
    schemaData: {
      tables: {
        type: Array,
        default: [],
      },
      relationships: {
        type: Array,
        default: [],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
projectSchema.index({ userId: 1 });
projectSchema.index({ userId: 1, name: 1 });

const Project = mongoose.model<IProject>('Project', projectSchema);

export default Project;
