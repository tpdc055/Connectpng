"use client";

import { useAuth } from "@/contexts/AuthContext";
import { LoginForm } from "@/components/LoginForm";
import Dashboard from "@/components/Dashboard";
import { SetupChecker } from "@/components/SetupChecker";

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-3 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-800 font-medium">Loading PNG Road Construction Monitor...</p>
          <p className="text-blue-600 text-sm mt-2">Papua New Guinea Department of Works</p>
        </div>
      </div>
    );
  }

  return (
    <SetupChecker>
      {user ? <Dashboard /> : <LoginForm />}
    </SetupChecker>
  );
}
