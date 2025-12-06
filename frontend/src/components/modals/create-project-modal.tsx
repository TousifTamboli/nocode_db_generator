"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Database,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Server,
  CircleAlert,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useProjectStore } from "@/stores/project-store";
import { DatabaseType } from "@/types/project";

// Validation schemas for each step
const mysqlConfigSchema = z.object({
  host: z.string().min(1, "Host is required"),
  port: z.number().min(1, "Port must be at least 1").max(65535, "Port must be at most 65535"),
  user: z.string().min(1, "Username is required"),
  password: z.string(),
  databaseName: z
    .string()
    .min(1, "Database name is required")
    .max(64, "Database name cannot exceed 64 characters")
    .regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, "Invalid database name. Use letters, numbers, and underscores only."),
  projectName: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(100, "Project name cannot exceed 100 characters"),
});

type MySQLFormValues = z.infer<typeof mysqlConfigSchema>;

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "select-type" | "mysql-config";

export function CreateProjectModal({ isOpen, onClose, onSuccess }: CreateProjectModalProps) {
  const [step, setStep] = useState<Step>("select-type");
  const [selectedType, setSelectedType] = useState<DatabaseType | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);

  const { createProject, testMySQLConnection, isLoading } = useProjectStore();

  const form = useForm<MySQLFormValues>({
    resolver: zodResolver(mysqlConfigSchema) as never,
    defaultValues: {
      host: "localhost",
      port: 3306,
      user: "root",
      password: "",
      databaseName: "",
      projectName: "",
    },
  });

  const handleSelectType = (type: DatabaseType) => {
    setSelectedType(type);
    if (type === "mysql") {
      setStep("mysql-config");
    } else {
      // MongoDB - coming soon
      toast.info("MongoDB support coming soon!");
    }
  };

  const handleTestConnection = async () => {
    const values = form.getValues();
    setIsTestingConnection(true);
    setConnectionTested(false);

    const result = await testMySQLConnection({
      host: values.host,
      port: values.port,
      user: values.user,
      password: values.password,
    });

    setIsTestingConnection(false);

    if (result.success) {
      setConnectionTested(true);
      toast.success("Connection successful!", {
        description: "MySQL server is reachable.",
      });
    } else {
      toast.error("Connection failed", {
        description: result.message,
      });
    }
  };

  const onSubmit = async (values: MySQLFormValues) => {
    const result = await createProject({
      name: values.projectName,
      databaseType: "mysql",
      databaseName: values.databaseName,
      mysqlConfig: {
        host: values.host,
        port: values.port,
        user: values.user,
        password: values.password,
      },
    });

    if (result.success) {
      toast.success("Project created!", {
        description: `Database '${values.databaseName}' has been created in MySQL.`,
      });
      handleClose();
      onSuccess();
    } else {
      toast.error("Failed to create project", {
        description: result.message,
      });
    }
  };

  const handleClose = () => {
    setStep("select-type");
    setSelectedType(null);
    setConnectionTested(false);
    form.reset();
    onClose();
  };

  const handleBack = () => {
    setStep("select-type");
    setSelectedType(null);
    setConnectionTested(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {step === "select-type" ? "Create New Project" : "MySQL Configuration"}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {step === "select-type"
              ? "Select the type of database for your project"
              : "Configure your MySQL connection and create a new database"}
          </DialogDescription>
        </DialogHeader>

        {step === "select-type" && (
          <div className="grid grid-cols-2 gap-4 py-4">
            {/* MySQL Option */}
            <button
              onClick={() => handleSelectType("mysql")}
              className="group relative p-6 rounded-xl border-2 border-zinc-700 hover:border-blue-500/50 bg-zinc-800/50 hover:bg-zinc-800 transition-all duration-200 flex flex-col items-center gap-3"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                <Database className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <p className="font-medium text-white">MySQL</p>
                <p className="text-xs text-zinc-500 mt-1">Relational Database</p>
              </div>
            </button>

            {/* MongoDB Option (Coming Soon) */}
            <button
              onClick={() => handleSelectType("mongodb")}
              className="group relative p-6 rounded-xl border-2 border-zinc-700/50 bg-zinc-800/30 transition-all duration-200 flex flex-col items-center gap-3 opacity-60 cursor-not-allowed"
              disabled
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg opacity-50">
                <Database className="w-7 h-7 text-white" />
              </div>
              <div className="text-center">
                <p className="font-medium text-zinc-400">MongoDB</p>
                <p className="text-xs text-zinc-600 mt-1">Coming Soon</p>
              </div>
            </button>
          </div>
        )}

        {step === "mysql-config" && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              {/* Connection Details Section */}
              <div className="space-y-3 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                  <Server className="w-4 h-4" />
                  MySQL Connection
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="host"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-400 text-xs">Host</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="localhost"
                            className="h-9 bg-zinc-900 border-zinc-700 text-white text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="port"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-400 text-xs">Port</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="3306"
                            className="h-9 bg-zinc-900 border-zinc-700 text-white text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="user"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-400 text-xs">Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="root"
                            className="h-9 bg-zinc-900 border-zinc-700 text-white text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-400 text-xs">Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="h-9 bg-zinc-900 border-zinc-700 text-white text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400 text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="w-full mt-2 bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : connectionTested ? (
                    <>
                      <Check className="w-4 h-4 mr-2 text-green-400" />
                      Connection Verified
                    </>
                  ) : (
                    <>
                      <CircleAlert className="w-4 h-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>
              </div>

              {/* Project Details Section */}
              <div className="space-y-3 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-300 mb-2">
                  <Database className="w-4 h-4" />
                  Database Details
                </div>

                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400 text-xs">Project Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="My Awesome Project"
                          className="h-9 bg-zinc-900 border-zinc-700 text-white text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="databaseName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400 text-xs">
                        Database Name
                        <span className="text-zinc-600 ml-1">(will be created in MySQL)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="my_database"
                          className="h-9 bg-zinc-900 border-zinc-700 text-white text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Project
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
