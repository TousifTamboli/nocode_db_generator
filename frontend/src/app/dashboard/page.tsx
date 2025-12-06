"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Database, LogOut, Plus, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";
import { useProjectStore } from "@/stores/project-store";
import { CreateProjectModal } from "@/components/modals/create-project-modal";

export default function DashboardPage() {
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const { projects, fetchProjects, deleteProject, isLoading } = useProjectStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, fetchProjects]);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    
    const result = await deleteProject(id);
    if (result.success) {
      toast.success("Project deleted");
    } else {
      toast.error("Failed to delete project", { description: result.message });
    }
  };

  const handleProjectSuccess = () => {
    fetchProjects();
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">NoCode DB</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-zinc-400 text-sm hidden sm:inline">
              Welcome, <span className="text-white font-medium">{user.name}</span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Your Projects</h1>
          <p className="text-zinc-400">Create and manage your database schemas</p>
        </div>

        {/* Projects grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create New Project Card */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="group relative h-64 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-purple-500/50 bg-zinc-900/30 hover:bg-zinc-800/30 transition-all duration-300 flex flex-col items-center justify-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 group-hover:bg-purple-500/20 flex items-center justify-center transition-all duration-300">
              <Plus className="w-8 h-8 text-zinc-500 group-hover:text-purple-400 transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-zinc-300 font-medium group-hover:text-white transition-colors">
                Create New Project
              </p>
              <p className="text-zinc-500 text-sm mt-1">MySQL or MongoDB schema</p>
            </div>
          </button>

          {/* Existing Projects */}
          {projects.map((project) => (
            <div
              key={project.id}
              className="group relative h-64 rounded-2xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 transition-all duration-300 flex flex-col p-6"
            >
              {/* Database type badge */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    project.databaseType === "mysql"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {project.databaseType.toUpperCase()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id, project.name);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              {/* Project info */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1 truncate">
                  {project.name}
                </h3>
                <p className="text-sm text-zinc-500 mb-2">
                  Database: <span className="text-zinc-400">{project.databaseName}</span>
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <Calendar className="w-3 h-3" />
                  {new Date(project.createdAt).toLocaleDateString()}
                </div>
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs"
                  onClick={() => {
                    // TODO: Navigate to workspace
                    toast.info("Workspace coming soon!");
                  }}
                >
                  Open
                </Button>
              </div>
            </div>
          ))}

          {/* Loading state */}
          {isLoading && (
            <div className="h-64 rounded-2xl border border-zinc-800 bg-zinc-900/50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          )}
        </div>
      </main>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleProjectSuccess}
      />
    </div>
  );
}
