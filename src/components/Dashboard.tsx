"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useServerSentEvents } from "@/hooks/useServerSentEvents";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapComponent } from "@/components/MapComponent";
import { DataInputForm } from "@/components/DataInputForm";
import { ProjectStats } from "@/components/ProjectStats";
import { DynamicProgressTracker } from "@/components/DynamicProgressTracker";
import { SpreadsheetImport } from "@/components/SpreadsheetImport";
import { UserManagement } from "@/components/UserManagement";
import { ActivityManagement } from "@/components/ActivityManagement";
import { ProjectSetup } from "@/components/ProjectSetup";
import { SystemAdmin } from "@/components/SystemAdmin";
import { LogOut, User, Users, Wifi, WifiOff, Bell, MapPin, Settings, Activity, FolderOpen, Shield } from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("monitoring");
  const [projectData, setProjectData] = useState(null);
  const [realtimeNotifications, setRealtimeNotifications] = useState<Array<{
    id: number;
    type: string;
    message: string;
    title?: string;
    timestamp: string;
    data?: unknown;
    priority?: string;
  }>>([]);
  const { user, logout } = useAuth();

  // Permission checks
  const canManageUsers = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canManageActivities = user?.role === 'ADMIN';
  const canManageProjects = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const canAccessSystemAdmin = user?.role === 'ADMIN';

  // Server-Sent Events integration for real-time updates
  const { connectionStatus, isConnected, connectedUsers } = useServerSentEvents({
    projectId: projectData?.id,
    onGpsPointAdded: (data) => {
      console.log('🛰️ Real-time GPS point added:', data);
      fetchProjectData();

      setRealtimeNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'gps_point',
        message: `New GPS point added for ${data.gpsPoint?.phase} construction`,
        timestamp: new Date().toISOString(),
        data: data.gpsPoint
      }]);
    },
    onUserJoined: (data) => {
      console.log('👤 User joined:', data);
      setRealtimeNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'user_joined',
        message: `${data.user?.name} joined the monitoring session`,
        timestamp: new Date().toISOString(),
        data: data.user
      }]);
    },
    onProgressUpdate: (data) => {
      console.log('📊 Progress update:', data);
      fetchProjectData();

      setRealtimeNotifications(prev => [...prev, {
        id: Date.now(),
        type: 'progress_update',
        message: `Progress updated: ${data.description}`,
        timestamp: new Date().toISOString(),
        data
      }]);
    }
  });

  const fetchProjectData = async () => {
    try {
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.projects && data.projects.length > 0) {
          setProjectData(data.projects[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'MANAGER': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'SUPERVISOR': return 'bg-green-100 text-green-800 border-green-300';
      case 'ENGINEER': return 'bg-orange-100 text-orange-800 border-orange-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded shadow-lg"></div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Connect PNG</h1>
                  <div className="text-sm text-gray-600">Road Construction Monitoring</div>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-100 border-green-500 text-green-800">
                Production System
              </Badge>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border">
                {isConnected ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-700 font-medium">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-red-500" />
                    <span className="text-xs text-red-700 font-medium">{connectionStatus}</span>
                  </>
                )}
              </div>

              {/* Real-time Notifications */}
              {realtimeNotifications.length > 0 && (
                <div className="relative">
                  <Button variant="outline" size="sm" className="bg-white">
                    <Bell className="h-4 w-4" />
                    <span className="ml-1 text-xs">{realtimeNotifications.length}</span>
                  </Button>
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-60 overflow-y-auto">
                    <div className="p-2 border-b bg-yellow-50">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-3 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded-sm"></div>
                        <span className="text-sm font-medium text-gray-800">PNG Live Updates</span>
                      </div>
                    </div>
                    {realtimeNotifications.map((notification) => (
                      <div key={notification.id} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                        <div className="text-sm font-medium text-gray-900">
                          {notification.title || notification.message}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* User Info */}
              <div className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm">
                <User className="h-5 w-5 text-gray-600" />
                <div className="text-right">
                  <div className="font-medium text-gray-900">{user?.name}</div>
                  <Badge className={`text-xs ${getRoleColor(user?.role || '')}`}>
                    {user?.role}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="ml-2"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Navigation Tabs */}
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 h-auto mb-8">
            <TabsTrigger value="monitoring" className="flex items-center gap-2 py-3">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Monitoring</span>
            </TabsTrigger>

            {canManageActivities && (
              <TabsTrigger value="activities" className="flex items-center gap-2 py-3">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Activities</span>
              </TabsTrigger>
            )}

            {canManageUsers && (
              <TabsTrigger value="users" className="flex items-center gap-2 py-3">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users</span>
              </TabsTrigger>
            )}

            {canManageProjects && (
              <TabsTrigger value="projects" className="flex items-center gap-2 py-3">
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Projects</span>
              </TabsTrigger>
            )}

            {canAccessSystemAdmin && (
              <TabsTrigger value="system" className="flex items-center gap-2 py-3">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">System</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab Content */}

          {/* 1. Construction Monitoring */}
          <TabsContent value="monitoring" className="mt-8 space-y-8">
            {/* Project Overview Stats */}
            <ProjectStats projectData={projectData} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Panel - Controls */}
              <div className="lg:col-span-1 space-y-6">
                {/* Data Input */}
                {user?.role && ['ENGINEER', 'SUPERVISOR', 'MANAGER', 'ADMIN'].includes(user.role) && (
                  <DataInputForm
                    projectId={projectData?.id}
                    onDataAdded={fetchProjectData}
                  />
                )}

                {/* Progress Tracker */}
                <DynamicProgressTracker
                  projectId={projectData?.id}
                />

                {/* Spreadsheet Import/Export */}
                {user?.role && ['ENGINEER', 'SUPERVISOR', 'MANAGER', 'ADMIN'].includes(user.role) && (
                  <SpreadsheetImport
                    projectId={projectData?.id}
                    onImportComplete={fetchProjectData}
                  />
                )}
              </div>

              {/* Right Panel - Map */}
              <div className="lg:col-span-2">
                <Card className="h-[800px]">
                  <CardHeader>
                    <CardTitle>Live Progress Map</CardTitle>
                    <CardDescription>
                      Real-time visualization of construction progress with GPS coordinates
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-full">
                    <MapComponent
                      projectId={projectData?.id}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* 2. Activity Management */}
          {canManageActivities && (
            <TabsContent value="activities" className="mt-8">
              <ActivityManagement />
            </TabsContent>
          )}

          {/* 3. User Management */}
          {canManageUsers && (
            <TabsContent value="users" className="mt-8">
              <UserManagement />
            </TabsContent>
          )}

          {/* 4. Project Setup */}
          {canManageProjects && (
            <TabsContent value="projects" className="mt-8">
              <ProjectSetup />
            </TabsContent>
          )}

          {/* 5. System Administration */}
          {canAccessSystemAdmin && (
            <TabsContent value="system" className="mt-8">
              <SystemAdmin />
            </TabsContent>
          )}
        </Tabs>

        {/* Footer */}
        <div className="mt-12 p-6 bg-gradient-to-r from-yellow-50 to-red-50 border-2 border-yellow-400 rounded-lg">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="w-16 h-12 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded shadow-lg mb-2"></div>
              <div className="text-xs font-semibold text-gray-700">PNG Flag</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-xl font-bold text-gray-800">Connect PNG Program</h3>
                <Badge variant="outline" className="bg-yellow-100 border-yellow-500 text-yellow-800">
                  Infrastructure Development
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-gray-700">Project Sponsor</div>
                  <div className="text-gray-600">ITCFA - Exxon Mobile PNG</div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">Current User Access</div>
                  <div className="text-gray-600">
                    {user?.role === 'ENGINEER' && "GPS tracking and data input"}
                    {user?.role === 'SUPERVISOR' && "Progress monitoring and verification"}
                    {user?.role === 'MANAGER' && "Project oversight and reporting"}
                    {user?.role === 'ADMIN' && "Full system administration"}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">System Status</div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Operational</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
