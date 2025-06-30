"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Database, Settings, AlertTriangle } from "lucide-react";

export function SystemAdmin() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-6 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded shadow-sm"></div>
          <h2 className="text-3xl font-bold text-gray-900">System Administration</h2>
          <Badge variant="outline" className="bg-red-100 border-red-500 text-red-800">
            Admin Only
          </Badge>
        </div>
        <p className="text-gray-600 mt-2">Advanced system configuration and maintenance tools</p>
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mt-3">
          <strong>⚠️ Warning:</strong> These tools can affect system operation. Use with caution.
        </div>
      </div>

      {/* System Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Database Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Tools
            </CardTitle>
            <CardDescription>
              Database maintenance and cleanup operations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Database className="h-4 w-4 mr-2" />
              Clean Demo Data
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-2" />
              Reset System
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Backup Database
            </Button>
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Config
            </CardTitle>
            <CardDescription>
              System-wide configuration settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-600">
              <div className="flex justify-between py-2">
                <span>Database Status:</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">
                  Connected
                </Badge>
              </div>
              <div className="flex justify-between py-2">
                <span>System Version:</span>
                <span>v1.0.0</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Active Users:</span>
                <span>1</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Logs
            </CardTitle>
            <CardDescription>
              Monitor system activity and errors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <Shield className="h-4 w-4 mr-2" />
              View Activity Logs
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <AlertTriangle className="h-4 w-4 mr-2" />
              View Error Logs
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Database className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced System Tools</h3>
            <p className="text-gray-600 mb-4">Additional system administration features coming soon.</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <div className="text-sm text-blue-800">
                <strong>🚧 Planned Features:</strong>
                <ul className="text-left mt-2 space-y-1">
                  <li>• Performance monitoring</li>
                  <li>• Automated backups</li>
                  <li>• User session management</li>
                  <li>• System health checks</li>
                  <li>• Configuration exports</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
