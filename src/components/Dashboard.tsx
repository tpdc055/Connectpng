"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useServerSentEvents } from "@/hooks/useServerSentEvents";
import { ProjectSelector } from "@/components/ProjectSelector";
import { Reports } from "@/components/Reports";
import { MapComponent } from "@/components/MapComponent";
import { DynamicProgressTracker } from "@/components/DynamicProgressTracker";
import { UserManagement } from "@/components/UserManagement";
import { ActivityManagement } from "@/components/ActivityManagement";
import { ProjectManagement } from "@/components/ProjectManagement";
import { ContractorManagement } from "@/components/ContractorManagement";
import { ContractAssignment } from "@/components/ContractAssignment";
import { SystemConfiguration } from "@/components/SystemConfiguration";
import { ProgressReportManager } from "@/components/ProgressReportManager";
import { FinancialDashboard } from "@/components/FinancialDashboard";
import { HSEIncidentReporter } from "@/components/HSEIncidentReporter";
import { QualityComplianceTracker } from "@/components/QualityComplianceTracker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Zap, Users, Building, Settings, FileText, CheckCircle, AlertCircle, BarChart3, DollarSign, Shield, ClipboardCheck } from "lucide-react";
import * as LucideIcons from "lucide-react";

// Enhanced GPS Test Component
function GPSTestComponent({ project }: { project: Project }) {
  const [gpsData, setGpsData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testType, setTestType] = useState<'project' | 'all'>('project');

  const testGPSAPI = async (type: 'project' | 'all') => {
    try {
      setLoading(true);
      setError('');
      setTestType(type);

      const token = localStorage.getItem('auth_token');
      console.log('🔍 Testing GPS API:', type === 'project' ? `Project ${project.name}` : 'All Projects');

      const url = type === 'project'
        ? `/api/gps-points?projectId=${project.id}`
        : `/api/gps-points`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 API Response:', response.status);

      if (response.ok) {
        const data = await response.json();
        setGpsData(data);
        console.log('📍 GPS Data Retrieved:', data);
      } else {
        const errorData = await response.text();
        setError(`API Error ${response.status}: ${errorData}`);
        console.error('❌ API Error:', errorData);
      }
    } catch (err: any) {
      setError(`Network Error: ${err.message}`);
      console.error('🌐 Network Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          GPS API Debug Tool
        </CardTitle>
        <CardDescription>
          Test GPS point retrieval for debugging purposes (can be removed in production)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={() => testGPSAPI('project')}
              disabled={loading}
              variant={testType === 'project' && gpsData ? 'default' : 'outline'}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {loading && testType === 'project' ? 'Testing...' : `Test ${project.name} GPS`}
            </Button>

            <Button
              onClick={() => testGPSAPI('all')}
              disabled={loading}
              variant={testType === 'all' && gpsData ? 'default' : 'outline'}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              {loading && testType === 'all' ? 'Testing...' : 'Test All Projects GPS'}
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <strong>API Error:</strong>
              </div>
              <div className="mt-1 text-sm">{error}</div>
            </div>
          )}

          {gpsData && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4" />
                <strong>Success!</strong> Found {gpsData.gpsPoints?.length || 0} GPS points
              </div>

              {gpsData.gpsPoints && gpsData.gpsPoints.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-semibold mb-2">Sample GPS Points:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {gpsData.gpsPoints.slice(0, 4).map((point: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded-lg border text-sm">
                        <div className="font-medium text-gray-800 mb-1">Point {index + 1}</div>
                        <div><strong>Phase:</strong> {point.phase}</div>
                        <div><strong>Side:</strong> {point.side}</div>
                        <div><strong>Distance:</strong> {point.distance}m</div>
                        <div><strong>Location:</strong> {point.latitude.toFixed(4)}, {point.longitude.toFixed(4)}</div>
                        <div><strong>Status:</strong> <Badge variant="outline" className="text-xs">{point.status}</Badge></div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(point.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                  {gpsData.gpsPoints.length > 4 && (
                    <p className="text-sm mt-2 font-medium">
                      ...and {gpsData.gpsPoints.length - 4} more GPS points
                    </p>
                  )}
                </div>
              )}

              {(!gpsData.gpsPoints || gpsData.gpsPoints.length === 0) && (
                <div className="mt-2 text-sm">
                  No GPS points found. Consider adding sample GPS data for testing.
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Interface definitions
interface Project {
  id: string;
  name: string;
  description?: string;
  sponsor?: string;
  startDate?: string;
  estimatedEndDate?: string;
  totalDistance?: number;
  status: string;
  teamLead?: string;
  projectType?: string;
  totalSections?: number;
  contractMethod?: string;
  fundingSource?: string;
  governmentPriority?: string;
  latitude?: number;
  longitude?: number;
  province?: {
    id: string;
    name: string;
    code: string;
    region: string;
    capital?: string;
  };
  roadSections?: Array<{
    id: string;
    sectionName: string;
    status: string;
    progressPercentage?: number;
    assignedContractor?: {
      name: string;
    };
  }>;
  _count?: {
    contractorProjects: number;
    roadSections: number;
    gpsPoints: number;
  };
}

interface Notification {
  id: string;
  message: string;
  timestamp: string;
  type?: string;
}

interface SystemSettings {
  systemName: string;
  systemSubtitle: string;
  organizationName: string;
  organizationSubtitle: string;
  dashboardWelcomeTitle: string;
  dashboardWelcomeText: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  enableGpsTracking: boolean;
  enableContractors: boolean;
  enableFinancials: boolean;
  enableReports: boolean;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  requiredRole?: string;
  description?: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("reports");
  const [selectedProject, setSelectedProject] = useState<Project | undefined>();
  const [activePhase, setActivePhase] = useState("all");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [navigationItems, setNavigationItems] = useState<NavigationItem[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // Real-time connection status
  const { isConnected, connectionStatus } = useServerSentEvents({
    onMessage: (data) => {
      // Handle real-time messages
      if (data.type === 'gps-update') {
        setNotifications(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            message: `GPS point added: ${data.phase} construction`,
            timestamp: new Date().toISOString(),
            type: 'gps-update'
          }
        ]);
      }
    },
    projectId: selectedProject?.id,
  });

  useEffect(() => {
    fetchSystemConfiguration();
  }, []);

  useEffect(() => {
    if (user) {
      fetchNavigation();
    }
  }, [user]);

  const fetchSystemConfiguration = async () => {
    try {
      setSettingsLoading(true);
      const response = await fetch('/api/system/settings');

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);

        // Update document title with system name
        if (data.settings.systemName) {
          document.title = `${data.settings.systemName} - Dashboard`;
        }

        // Apply favicon if provided
        if (data.settings.faviconUrl) {
          const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
          if (link) {
            link.href = data.settings.faviconUrl;
          }
        }
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchNavigation = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/system/navigation', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setNavigationItems(data.navigationItems);

        // Set first available tab as active if current tab is not available
        if (data.navigationItems.length > 0) {
          const availableRoutes = data.navigationItems.map((item: NavigationItem) => item.route);
          if (!availableRoutes.includes(activeTab)) {
            setActiveTab(data.navigationItems[0].route);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching navigation:', error);
    }
  };

  // Listen for project updates from ProjectManagement component
  useEffect(() => {
    const handleProjectUpdate = (event: CustomEvent) => {
      console.log('🔄 Project updated, refreshing data...');
      // Force re-fetch project data if it's the current project
      if (selectedProject && event.detail.project?.id === selectedProject.id) {
        // Update selected project with new data
        setSelectedProject(event.detail.project);

        // Show success notification
        setNotifications(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            message: `Project "${event.detail.project.name}" updated successfully`,
            timestamp: new Date().toISOString(),
            type: 'project-update'
          }
        ]);
      }
    };

    window.addEventListener('project-updated', handleProjectUpdate as EventListener);
    return () => window.removeEventListener('project-updated', handleProjectUpdate as EventListener);
  }, [selectedProject]);

  // Get icon component from string name
  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent || FileText; // Fallback to FileText if icon not found
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
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
      style={{
        background: `linear-gradient(135deg, ${settings.primaryColor}10, ${settings.secondaryColor}10)`
      }}
    >
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4" style={{ borderBottomColor: settings.accentColor }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
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

            {/* Project Selection */}
            {selectedProject && (
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{selectedProject.name}</div>
                  <div className="text-sm text-gray-600">
                    {selectedProject.province?.name || 'Unknown Province'}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="border-blue-500 text-blue-800"
                  style={{
                    backgroundColor: `${settings.primaryColor}20`,
                    borderColor: settings.primaryColor,
                    color: settings.primaryColor
                  }}
                >
                  {selectedProject.status.replace('_', ' ')}
                </Badge>
              </div>
            )}

            {/* User Info and Actions */}
            <div className="flex items-center gap-4">
              {isConnected && (
                <div
                  className="flex items-center gap-2 px-3 py-1 border rounded-full"
                  style={{
                    backgroundColor: `${settings.secondaryColor}20`,
                    borderColor: settings.secondaryColor,
                    color: settings.secondaryColor
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: settings.secondaryColor }}
                  ></div>
                  <span className="text-xs font-medium">Live Connected</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  Welcome, <span className="font-medium">{user?.name}</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="text-gray-600 hover:text-gray-900"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Project Selection Section - Always Visible */}
        <div className="mb-6">
          <ProjectSelector
            selectedProject={selectedProject}
            onProjectSelect={setSelectedProject}
          />
        </div>

        {/* Dynamic Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            {navigationItems.map((tab) => {
              const IconComponent = getIconComponent(tab.icon);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.route)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.route
                      ? "shadow-sm"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                  style={
                    activeTab === tab.route
                      ? {
                          backgroundColor: `${settings.primaryColor}20`,
                          color: settings.primaryColor
                        }
                      : undefined
                  }
                  title={tab.description}
                >
                  <IconComponent className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Dynamic Tab Content */}
        <div className="space-y-6">
          {activeTab === "reports" && settings.enableReports && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              {selectedProject ? (
                <Reports projectId={selectedProject?.id} />
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Project for Reports</h3>
                  <p className="text-gray-600">Please select a project from the dropdown above to generate comprehensive reports.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "monitoring" && selectedProject && settings.enableGpsTracking && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="mb-6 p-4 border-l-4 rounded-lg" style={{
                  backgroundColor: `${settings.secondaryColor}10`,
                  borderLeftColor: settings.secondaryColor
                }}>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-6 rounded shadow-sm"
                      style={{
                        background: `linear-gradient(45deg, ${settings.primaryColor}, ${settings.secondaryColor}, ${settings.accentColor})`
                      }}
                    ></div>
                    <div>
                      <div
                        className="font-semibold"
                        style={{ color: settings.secondaryColor }}
                      >
                        🗺️ GPS Monitoring Active
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: settings.secondaryColor }}
                      >
                        Real-time GPS tracking for {selectedProject.name} in {selectedProject.province?.name}
                      </div>
                    </div>
                  </div>
                </div>

                {/* GPS Test Component (for debugging) */}
                <GPSTestComponent project={selectedProject} />

                {/* Enhanced Google Maps with Project Info */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5" style={{ color: settings.primaryColor }} />
                    Interactive GPS Map - {selectedProject.name}
                  </h4>
                  <MapComponent
                    activePhase={activePhase}
                    projectId={selectedProject.id}
                    project={selectedProject}
                  />
                </div>

                {/* Progress Tracker */}
                <div className="mt-6">
                  <DynamicProgressTracker projectId={selectedProject.id} />
                </div>
              </div>
            </div>
          )}

          {activeTab === "monitoring" && !selectedProject && settings.enableGpsTracking && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center py-12">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Select a Project for GPS Monitoring</h3>
                <p className="text-gray-600">Please select a project from the dropdown above to view interactive GPS monitoring and mapping.</p>
              </div>
            </div>
          )}

          {activeTab === "activities" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              {selectedProject ? (
                <ActivityManagement projectId={selectedProject.id} />
              ) : (
                <div className="text-center py-12">
                  <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Project for Activities</h3>
                  <p className="text-gray-600">Please select a project to view and manage activities.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "progress" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              {selectedProject ? (
                <ProgressReportManager projectId={selectedProject.id} />
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Project for Progress Monitoring</h3>
                  <p className="text-gray-600">Please select a project to track construction progress and create progress reports.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "financial" && settings.enableFinancials && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              {selectedProject ? (
                <FinancialDashboard projectId={selectedProject.id} />
              ) : (
                <div className="text-center py-12">
                  <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Project for Financial Monitoring</h3>
                  <p className="text-gray-600">Please select a project to track multi-source funding and financial progress.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "hse" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              {selectedProject ? (
                <HSEIncidentReporter projectId={selectedProject.id} />
              ) : (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Project for HSE Management</h3>
                  <p className="text-gray-600">Please select a project to manage health, safety, and environmental incidents.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "quality" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              {selectedProject ? (
                <QualityComplianceTracker projectId={selectedProject.id} />
              ) : (
                <div className="text-center py-12">
                  <ClipboardCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Project for Quality Control</h3>
                  <p className="text-gray-600">Please select a project to track material testing and quality compliance.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "users" && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              {selectedProject ? (
                <UserManagement projectId={selectedProject.id} />
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Project for User Management</h3>
                  <p className="text-gray-600">Please select a project to manage users and permissions.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "contractors" && settings.enableContractors && (user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <ContractorManagement />
            </div>
          )}

          {activeTab === "contracts" && settings.enableFinancials && (user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <ContractAssignment projectId={selectedProject?.id} />
            </div>
          )}

          {activeTab === "projects" && (
            <div className="space-y-6">
              {selectedProject && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-8 h-6 rounded shadow-sm"
                      style={{
                        background: `linear-gradient(45deg, ${settings.primaryColor}, ${settings.secondaryColor}, ${settings.accentColor})`
                      }}
                    ></div>
                    <h3 className="text-lg font-semibold">Project Details - {selectedProject.name}</h3>
                  </div>

                  {/* Project Information Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    <div
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: `${settings.primaryColor}10` }}
                    >
                      <div
                        className="text-2xl font-bold"
                        style={{ color: settings.primaryColor }}
                      >
                        {selectedProject._count?.gpsPoints || 0}
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: settings.primaryColor }}
                      >
                        GPS Points Recorded
                      </div>
                    </div>
                    <div
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: `${settings.secondaryColor}10` }}
                    >
                      <div
                        className="text-2xl font-bold"
                        style={{ color: settings.secondaryColor }}
                      >
                        {selectedProject._count?.contractorProjects || 0}
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: settings.secondaryColor }}
                      >
                        Active Contractors
                      </div>
                    </div>
                    <div
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: `${settings.accentColor}10` }}
                    >
                      <div
                        className="text-2xl font-bold"
                        style={{ color: settings.accentColor }}
                      >
                        {selectedProject._count?.roadSections || 0}
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: settings.accentColor }}
                      >
                        Road Sections
                      </div>
                    </div>
                  </div>

                  {/* Road Sections */}
                  {selectedProject.roadSections && selectedProject.roadSections.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Road Sections</h4>
                      <div className="grid gap-3">
                        {selectedProject.roadSections.map((section) => (
                          <div key={section.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="font-medium">{section.sectionName}</div>
                              {section.assignedContractor && (
                                <div className="text-sm text-gray-600">
                                  Contractor: {section.assignedContractor.name}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-medium">{section.progressPercentage || 0}%</div>
                              <Badge variant="outline" className="text-xs">
                                {section.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Project Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Project Information</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Province:</strong> {selectedProject.province?.name || 'Not specified'}</div>
                        <div><strong>Distance:</strong> {selectedProject.totalDistance || 'Not specified'}km</div>
                        <div><strong>Status:</strong> {selectedProject.status}</div>
                        <div><strong>Type:</strong> {selectedProject.projectType || 'Road Construction'}</div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Project Management</h4>
                      <div className="space-y-2 text-sm">
                        <div><strong>Sponsor:</strong> {selectedProject.sponsor || 'Not specified'}</div>
                        <div><strong>Team Lead:</strong> {selectedProject.teamLead || 'Not assigned'}</div>
                        <div><strong>Contract Method:</strong> {selectedProject.contractMethod || 'Not specified'}</div>
                        <div><strong>Funding:</strong> {selectedProject.fundingSource || 'Not specified'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!selectedProject && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="text-center py-12">
                    <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Select a Project</h3>
                    <p className="text-gray-600">Please select a project from the dropdown above to view detailed project information.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "system" && user?.role === 'ADMIN' && (
            <div className="space-y-6">
              {/* System Configuration */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <SystemConfiguration onSettingsUpdate={fetchSystemConfiguration} />
              </div>

              {/* Project Management */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <ProjectManagement />
              </div>
            </div>
          )}
        </div>

        {/* Welcome Message for No Project Selected */}
        {!selectedProject && ["reports", "monitoring", "activities", "users", "contracts", "quality"].includes(activeTab) && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div
              className="w-16 h-12 rounded mx-auto mb-4"
              style={{
                background: `linear-gradient(45deg, ${settings.primaryColor}, ${settings.secondaryColor}, ${settings.accentColor})`
              }}
            ></div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: settings.primaryColor }}
            >
              {settings.dashboardWelcomeTitle}
            </h2>
            <p className="text-gray-600 mb-6">
              {settings.dashboardWelcomeText}
            </p>
            <Button
              onClick={() => setActiveTab("projects")}
              style={{
                backgroundColor: settings.primaryColor,
                color: 'white'
              }}
            >
              Select Project
            </Button>
          </div>
        )}
      </main>

      {/* Real-time Notifications */}
      {notifications.length > 0 && (
        <div className="fixed bottom-4 right-4 space-y-2 z-50">
          {notifications.slice(-3).map((notification) => (
            <div
              key={notification.id}
              className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm animate-fade-in"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-2 h-2 rounded-full mt-2 animate-pulse"
                  style={{ backgroundColor: settings.secondaryColor }}
                ></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {notification.message}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
