"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Database, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth-store";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, router]);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">NoCode DB</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-zinc-400 text-sm">
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
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Your Projects</h1>
          <p className="text-zinc-400">Create and manage your database schemas</p>
        </div>

        {/* Empty state - New project card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button className="group relative h-64 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-purple-500/50 bg-zinc-900/30 hover:bg-zinc-800/30 transition-all duration-300 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-800 group-hover:bg-purple-500/20 flex items-center justify-center transition-all duration-300">
              <Plus className="w-8 h-8 text-zinc-500 group-hover:text-purple-400 transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-zinc-300 font-medium group-hover:text-white transition-colors">Create New Project</p>
              <p className="text-zinc-500 text-sm mt-1">MySQL or MongoDB schema</p>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
