"use client";

import { useState, useEffect } from "react";
import { useSystemSettings } from "@/contexts/SystemSettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Users, Calendar, DollarSign, Building, Flag } from "lucide-react";

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

interface ProjectSelectorProps {
  selectedProject?: Project;
  onProjectSelect: (project: Project) => void;
}

export function ProjectSelector({ selectedProject, onProjectSelect }: ProjectSelectorProps) {
  const { settings } = useSystemSettings();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);

        // Auto-select first project if none selected
        if (!selectedProject && data.projects?.length > 0) {
          onProjectSelect(data.projects[0]);
        }
      } else {
        setError('Failed to fetch projects');
      }
    } catch (error) {
      setError('Error fetching projects');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-300';
      case 'PLANNING': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'TENDERING': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ON_HOLD': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Project Selection Dropdown */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-6 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded shadow-sm"></div>
            <CardTitle>Select Active Project</CardTitle>
            <Badge variant="outline" className="bg-green-100 border-green-500 text-green-800">
              {projects.length} Projects Available
            </Badge>
          </div>
          <CardDescription>
            Choose the project you want to monitor and manage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedProject?.id || ""}
            onValueChange={(projectId) => {
              const project = projects.find(p => p.id === projectId);
              if (project) {
                onProjectSelect(project);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-3">
                    <Flag className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-sm text-gray-500">
                        {project.province?.name} • {project.status}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Selected Project Details */}
      {selectedProject && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-6 h-4 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded"></div>
                <CardTitle>{selectedProject.name}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`border ${getStatusColor(selectedProject.status)}`}>
                  {selectedProject.status.replace('_', ' ')}
                </Badge>
                {selectedProject.governmentPriority && (
                  <Badge variant="outline" className={getPriorityColor(selectedProject.governmentPriority)}>
                    {selectedProject.governmentPriority} Priority
                  </Badge>
                )}
              </div>
            </div>
            <CardDescription>
              {selectedProject.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Province</span>
                </div>
                <div className="text-lg font-semibold text-blue-800">
                  {selectedProject.province?.name || 'Unknown'}
                </div>
                <div className="text-xs text-blue-600">
                  {selectedProject.province?.region} Region
                </div>
              </div>

              <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Building className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Contractors</span>
                </div>
                <div className="text-lg font-semibold text-green-800">
                  {selectedProject._count?.contractorProjects || 0}
                </div>
                <div className="text-xs text-green-600">
                  {selectedProject.contractMethod?.replace('_', ' ') || 'Single Contract'}
                </div>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">Sections</span>
                </div>
                <div className="text-lg font-semibold text-purple-800">
                  {selectedProject.totalSections || 1}
                </div>
                <div className="text-xs text-purple-600">
                  Road Sections
                </div>
              </div>

              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Funding</span>
                </div>
                <div className="text-lg font-semibold text-orange-800">
                  {selectedProject.sponsor?.includes(settings.organizationName) ? settings.organizationName :
                   selectedProject.sponsor?.includes('Government') ? 'Government' :
                   selectedProject.sponsor?.includes('External') ? 'External' : 'Sponsor'}
                </div>
                <div className="text-xs text-orange-600">
                  {selectedProject.fundingSource?.split(' ')[0] || 'Sponsor'}
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Project Timeline
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-700">Start Date</div>
                  <div className="text-gray-600">
                    {selectedProject.startDate
                      ? new Date(selectedProject.startDate).toLocaleDateString()
                      : 'Not set'
                    }
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Target Completion</div>
                  <div className="text-gray-600">
                    {selectedProject.estimatedEndDate
                      ? new Date(selectedProject.estimatedEndDate).toLocaleDateString()
                      : 'Not set'
                    }
                  </div>
                </div>
                <div>
                  <div className="font-medium text-gray-700">Team Lead</div>
                  <div className="text-gray-600">
                    {selectedProject.teamLead || 'Not assigned'}
                  </div>
                </div>
              </div>
            </div>

            {/* Road Sections Summary */}
            {selectedProject.roadSections && selectedProject.roadSections.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Road Sections Progress</h4>
                <div className="space-y-2">
                  {selectedProject.roadSections.map((section) => (
                    <div key={section.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
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
                        <Badge
                          variant="outline"
                          className={`text-xs ${getStatusColor(section.status)}`}
                        >
                          {section.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={() => window.location.href = '#monitoring'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <MapPin className="h-4 w-4 mr-2" />
                View on Map
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.href = '#activities'}
              >
                <Building className="h-4 w-4 mr-2" />
                Manage Activities
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
