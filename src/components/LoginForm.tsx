"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MapPin, Shield } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const { settings } = useSystemSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const success = await login(email, password);

    if (!success) {
      setError("Invalid email or password");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-8 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded shadow-lg"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{settings.systemName}</h1>
              <div className="text-sm text-gray-600">{settings.systemDescription}</div>
            </div>
          </div>
          <h2 className="text-lg text-gray-700 font-semibold">Project Management System</h2>
          <Badge variant="outline" className="bg-blue-50 border-blue-300 text-blue-800">
            {settings.defaultProjectName}
          </Badge>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Shield className="h-5 w-5 text-green-600" />
              Secure Access Portal
            </CardTitle>
            <CardDescription className="text-gray-600">
              Authorized personnel only - Enter your credentials to access the live road construction monitoring system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={`your.email@${settings.contactDomain}`}
                  required
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Production Footer */}
        <div className="text-center text-xs text-gray-500 space-y-2">
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-4 h-3 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded"></div>
              <span className="font-semibold text-gray-700">{settings.organizationName}</span>
            </div>
            <p className="text-gray-600">{settings.systemDescription}</p>
            <p className="text-gray-500 mt-1">{settings.organizationSubtitle}</p>
          </div>
          <p className="text-gray-400">🔒 Secure access required • Contact administrator for account registration</p>
        </div>
      </div>
    </div>
  );
}
