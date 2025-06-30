'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function AdminDebugPage() {
  const [formData, setFormData] = useState({
    name: 'PNG Administrator',
    email: 'admin@connectpng.com',
    password: 'PNGAdmin2024!',
    role: 'ADMIN'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/setup/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `PNG Administrator account created successfully! You can now login with ${formData.email}`
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to create administrator account'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Network error. Please check your database connection.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* PNG Government Header */}
      <div className="bg-blue-900 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-yellow-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🇵🇬</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Papua New Guinea</h1>
                <p className="text-blue-200 text-sm">Department of Works</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-sm">Administrator Setup</p>
              <p className="text-blue-100 text-xs">PNG Road Construction Monitor</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-red-600 rounded-xl mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">👤</span>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Create PNG Administrator
              </CardTitle>
              <CardDescription className="text-gray-600">
                Set up the initial administrator account for Papua New Guinea Department of Works
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Administrator Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="PNG Administrator"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="admin@connectpng.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Secure password"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 8 characters with uppercase, lowercase, numbers, and special characters
                  </p>
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <div className="mt-1">
                    <Badge variant="outline" className="bg-red-50 border-red-300 text-red-800">
                      ADMIN - Full System Access
                    </Badge>
                  </div>
                </div>

                {message && (
                  <Alert className={message.type === 'success' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}>
                    <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                      {message.text}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating Administrator...' : 'Create PNG Administrator'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 mb-2">After creating the administrator:</p>
                <a
                  href="/"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  → Go to Login Page
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Information Card */}
          <div className="mt-6 bg-white/80 backdrop-blur-sm rounded-lg p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-6 h-6 bg-gradient-to-r from-red-600 to-yellow-500 rounded mr-2"></div>
              <span className="text-gray-700 font-medium">Papua New Guinea Department of Works</span>
            </div>
            <p className="text-gray-600 text-sm">PNG Road Construction Monitor</p>
            <p className="text-gray-500 text-xs mt-1">Professional Infrastructure Monitoring Platform</p>
          </div>
        </div>
      </div>
    </div>
  );
}
