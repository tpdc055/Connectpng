"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, LogIn, AlertCircle, Eye, EyeOff } from "lucide-react";

interface SystemSettings {
  systemName: string;
  systemSubtitle: string;
  organizationName: string;
  organizationSubtitle: string;
  loginTitle: string;
  loginDescription: string;
  loginFooterText: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  supportEmail?: string;
  supportPhone?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const fetchSystemSettings = async () => {
    try {
      setSettingsLoading(true);
      const response = await fetch('/api/system/settings');

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        setIsFirstTimeSetup(data.isFirstTimeSetup);

        // Apply dynamic favicon if provided
        if (data.settings.faviconUrl) {
          const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (link) {
            link.href = data.settings.faviconUrl;
          }
        }

        // Update document title
        document.title = `${data.settings.systemName} - Login`;

      } else {
        console.error('Failed to load system settings');
        // Use minimal fallbacks
        setSettings({
          systemName: "Monitoring System",
          systemSubtitle: "Construction Management Platform",
          organizationName: "Government Department",
          organizationSubtitle: "Infrastructure Development",
          loginTitle: "Secure Access Portal",
          loginDescription: "Authorized personnel only - Enter your credentials to access the system",
          loginFooterText: "Contact administrator for account registration",
          primaryColor: "#3B82F6",
          secondaryColor: "#10B981",
          accentColor: "#F59E0B"
        });
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
      // Use minimal fallbacks
      setSettings({
        systemName: "Monitoring System",
        systemSubtitle: "Construction Management Platform",
        organizationName: "Government Department",
        organizationSubtitle: "Infrastructure Development",
        loginTitle: "Secure Access Portal",
        loginDescription: "Authorized personnel only - Enter your credentials to access the system",
        loginFooterText: "Contact administrator for account registration",
        primaryColor: "#3B82F6",
        secondaryColor: "#10B981",
        accentColor: "#F59E0B"
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    if (isRegistering && !name) {
      setError("Please enter your full name");
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
      const body = isRegistering
        ? { name: name.trim(), email: email.trim(), password }
        : { email: email.trim(), password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('auth_token', data.token);
        router.push('/dashboard');
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (error) {
      setError('Network error - please try again');
    } finally {
      setIsLoading(false);
    }
  };

  if (settingsLoading || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4"
      style={{
        background: `linear-gradient(135deg, ${settings.primaryColor}10, ${settings.secondaryColor}10)`
      }}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={`${settings.organizationName} Logo`}
              className="h-12 w-auto"
            />
          ) : (
            <div
              className="w-12 h-8 rounded shadow-lg"
              style={{
                background: `linear-gradient(45deg, ${settings.primaryColor}, ${settings.secondaryColor}, ${settings.accentColor})`
              }}
            ></div>
          )}
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ color: settings.primaryColor }}
            >
              {settings.systemName}
            </h1>
            <p
              className="text-sm"
              style={{ color: settings.secondaryColor }}
            >
              {settings.systemSubtitle}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {settings.organizationName}
          </h2>
          <p className="text-gray-600 text-sm">
            {settings.organizationSubtitle}
          </p>
        </div>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Shield
              className="h-5 w-5"
              style={{ color: settings.primaryColor }}
            />
            {settings.loginTitle}
          </CardTitle>
          <CardDescription className="text-sm">
            {settings.loginDescription}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required={isRegistering}
                />
              </div>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@domain.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              style={{
                backgroundColor: settings.primaryColor,
                color: 'white'
              }}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isRegistering ? 'Creating Account...' : 'Signing In...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  {isRegistering ? 'Create Account' : 'Sign In'}
                </div>
              )}
            </Button>
          </form>

          {isFirstTimeSetup && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm text-center">
              <p className="font-medium mb-1">First Time Setup</p>
              <p>Create an admin account to get started. The first user becomes the system administrator.</p>
            </div>
          )}

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError("");
                setName("");
                setEmail("");
                setPassword("");
              }}
              className="text-sm hover:underline"
              style={{ color: settings.primaryColor }}
            >
              {isRegistering
                ? 'Already have an account? Sign in'
                : (isFirstTimeSetup ? 'Create first admin account' : 'Need an account? Contact administrator')
              }
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="mt-8 text-center">
        <div
          className="flex items-center justify-center gap-2 mb-2"
          style={{ color: settings.primaryColor }}
        >
          <div
            className="w-4 h-3 rounded shadow-sm"
            style={{
              background: `linear-gradient(45deg, ${settings.primaryColor}, ${settings.secondaryColor}, ${settings.accentColor})`
            }}
          ></div>
          <span className="font-medium text-sm">{settings.organizationName}</span>
        </div>

        <p className="text-gray-600 text-sm mb-2">
          {settings.loginFooterText}
        </p>

        {(settings.supportEmail || settings.supportPhone) && (
          <div className="text-xs text-gray-500">
            {settings.supportEmail && (
              <span>Email: {settings.supportEmail}</span>
            )}
            {settings.supportEmail && settings.supportPhone && ' • '}
            {settings.supportPhone && (
              <span>Phone: {settings.supportPhone}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
