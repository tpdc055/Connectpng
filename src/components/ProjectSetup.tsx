"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderOpen } from "lucide-react";

export function ProjectSetup() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-6 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded shadow-sm"></div>
          <h2 className="text-3xl font-bold text-gray-900">Project Setup</h2>
          <Badge variant="outline" className="bg-blue-100 border-blue-500 text-blue-800">
            Configuration
          </Badge>
        </div>
        <p className="text-gray-600 mt-2">Configure project settings, locations, and parameters</p>
      </div>

      {/* Project Configuration */}
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Configuration</h3>
            <p className="text-gray-600 mb-4">Project setup and configuration features coming soon.</p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
              <div className="text-sm text-blue-800">
                <strong>🚧 Coming Soon:</strong>
                <ul className="text-left mt-2 space-y-1">
                  <li>• Project location management</li>
                  <li>• Timeline configuration</li>
                  <li>• Budget tracking setup</li>
                  <li>• Team assignments</li>
                  <li>• Milestone planning</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
