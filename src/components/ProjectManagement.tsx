"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapPin, Save, Edit, Plus, Trash2, Navigation, CheckCircle, AlertCircle } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description?: string;
  totalDistance?: number;
  status: string;
  projectType?: string;
  latitude?: number;
  longitude?: number;
  sponsor?: string;
  teamLead?: string;
  province?: {
    id: string;
    name: string;
    code: string;
    region: string;
    capital?: string;
  };
}

interface Province {
  id: string;
  name: string;
  code: string;
  region: string;
  capital?: string;
}

// ✅ Dynamic lookup interfaces
interface ProjectType {
  id: string;
  name: string;
  description?: string;
}

interface ProjectStatus {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

export function ProjectManagement() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [creatingProject, setCreatingProject] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    totalDistance: '',
    sponsor: '',
    teamLead: '',
    projectType: '',
    status: '',
    latitude: '',
    longitude: '',
    provinceId: ''
  });

  // Fetch projects and provinces
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      // Fetch projects, provinces, and lookup data in parallel
      const [projectsResponse, provincesResponse, lookupResponse] = await Promise.all([
        fetch('/api/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/provinces', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/lookup', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData.projects || []);
      }

      if (provincesResponse.ok) {
        const provincesData = await provincesResponse.json();
        setProvinces(provincesData.provinces || []);
      }

      if (lookupResponse.ok) {
        const lookupData = await lookupResponse.json();
        setProjectTypes(lookupData.projectTypes || []);
        setProjectStatuses(lookupData.projectStatuses || []);
      } else {
        console.log('Failed to load lookup data, using empty arrays');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      totalDistance: project.totalDistance?.toString() || '',
      sponsor: project.sponsor || '',
      teamLead: project.teamLead || '',
      projectType: project.projectType || '',
      status: project.status,
      latitude: project.latitude?.toString() || '',
      longitude: project.longitude?.toString() || '',
      provinceId: project.province?.id || ''
    });
  };

  const startCreating = () => {
    setCreatingProject(true);
    // Use first available options or empty strings
    const defaultProjectType = projectTypes.find(pt => pt.name.includes('Road')) || projectTypes[0];
    const defaultStatus = projectStatuses.find(ps => ps.name === 'PLANNING') || projectStatuses[0];

    setFormData({
      name: '', description: '', totalDistance: '', sponsor: '', teamLead: '',
      projectType: defaultProjectType?.id || '',
      status: defaultStatus?.id || '',
      latitude: '', longitude: '', provinceId: ''
    });
  };

  const cancelEditing = () => {
    setEditingProject(null);
    setCreatingProject(false);
    setFormData({
      name: '', description: '', totalDistance: '', sponsor: '', teamLead: '',
      projectType: '', status: '', latitude: '', longitude: '', provinceId: ''
    });
  };

  const createProject = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');

      const createData = {
        ...formData,
        totalDistance: formData.totalDistance ? Number(formData.totalDistance) : null,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(createData)
      });

      if (response.ok) {
        const createdData = await response.json();
        setMessage({ type: 'success', text: 'Project created successfully!' });

        // Force refresh data and update state
        await fetchData();

        // Also trigger a custom event for other components to refresh
        window.dispatchEvent(new CustomEvent('project-created', {
          detail: { project: createdData.project }
        }));

        cancelEditing();
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: `Failed to create project: ${error}` });
      }
    } catch (error) {
      console.error('Error creating project:', error);
      setMessage({ type: 'error', text: 'Failed to create project' });
    } finally {
      setSaving(false);
    }
  };

  const saveProject = async () => {
    if (!editingProject) return;

    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');

      const updateData = {
        ...formData,
        totalDistance: formData.totalDistance ? Number(formData.totalDistance) : null,
        latitude: formData.latitude ? Number(formData.latitude) : null,
        longitude: formData.longitude ? Number(formData.longitude) : null,
      };

      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const updatedData = await response.json();
        setMessage({ type: 'success', text: 'Project updated successfully!' });

        // Force refresh data and update state
        await fetchData();

        // Also trigger a custom event for other components to refresh
        window.dispatchEvent(new CustomEvent('project-updated', {
          detail: { project: updatedData.project }
        }));

        cancelEditing();
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: `Failed to update project: ${error}` });
      }
    } catch (error) {
      console.error('Error updating project:', error);
      setMessage({ type: 'error', text: 'Failed to update project' });
    } finally {
      setSaving(false);
    }
  };

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString()
          }));
          setMessage({ type: 'success', text: 'Current location captured!' });
        },
        (error) => {
          setMessage({ type: 'error', text: 'Failed to get current location' });
        }
      );
    } else {
      setMessage({ type: 'error', text: 'Geolocation not supported' });
    }
  };

  const getStatusColor = (statusId: string) => {
    const status = projectStatuses.find(s => s.id === statusId);
    if (status?.color) {
      // Use the dynamic color from database (implement proper color handling later)
      return `bg-gray-100 text-gray-800`; // Default while we implement proper color handling
    }

    // Fallback based on status name
    const statusName = status?.name?.toUpperCase();
    switch (statusName) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      case 'PLANNING': return 'bg-yellow-100 text-yellow-800';
      case 'TENDERING': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const clearMessage = () => {
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    if (message) clearMessage();
  }, [message]);

  // Helper functions for displaying lookup values
  const getProjectTypeName = (typeId: string) => {
    const type = projectTypes.find(t => t.id === typeId);
    return type?.name || typeId;
  };

  const getProjectStatusName = (statusId: string) => {
    const status = projectStatuses.find(s => s.id === statusId);
    return status?.name || statusId;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-6 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded shadow-sm"></div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Project Management</h2>
            <p className="text-gray-600">Manage project details, locations, and province assignments</p>
          </div>
        </div>

        <Button
          onClick={startCreating}
          disabled={editingProject !== null || creatingProject}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Project
        </Button>
      </div>

      {/* Success/Error Messages */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            {message.text}
          </div>
        </div>
      )}

      {/* Edit/Create Project Form */}
      {(editingProject || creatingProject) && (
        <Card className={editingProject ? "border-blue-200 bg-blue-50" : "border-green-200 bg-green-50"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingProject ? (
                <>
                  <Edit className="h-5 w-5" />
                  Editing: {editingProject.name}
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Create New Project
                </>
              )}
            </CardTitle>
            <CardDescription>
              {editingProject
                ? "Update project details and set precise coordinates for map centering"
                : "Create a new road construction project with location and province details"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <Label htmlFor="totalDistance">Total Distance (m)</Label>
                <Input
                  id="totalDistance"
                  type="number"
                  value={formData.totalDistance}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalDistance: e.target.value }))}
                  placeholder="Distance in meters"
                />
              </div>

              <div>
                <Label htmlFor="sponsor">Sponsor</Label>
                <Input
                  id="sponsor"
                  value={formData.sponsor}
                  onChange={(e) => setFormData(prev => ({ ...prev, sponsor: e.target.value }))}
                  placeholder="Project sponsor"
                />
              </div>

              <div>
                <Label htmlFor="teamLead">Team Lead</Label>
                <Input
                  id="teamLead"
                  value={formData.teamLead}
                  onChange={(e) => setFormData(prev => ({ ...prev, teamLead: e.target.value }))}
                  placeholder="Team lead name"
                />
              </div>

              <div>
                <Label htmlFor="projectType">Project Type</Label>
                <Select value={formData.projectType} onValueChange={(value) => setFormData(prev => ({ ...prev, projectType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map(type => (
                      <SelectItem key={type.id} value={type.id} title={type.description}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectStatuses.map(status => (
                      <SelectItem key={status.id} value={status.id} title={status.description}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="province">Province</Label>
                <Select value={formData.provinceId} onValueChange={(value) => setFormData(prev => ({ ...prev, provinceId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map(province => (
                      <SelectItem key={province.id} value={province.id}>
                        {province.name} ({province.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Project description"
                rows={3}
              />
            </div>

            {/* Location Section */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h4 className="font-medium">Project Location</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleLocationClick}
                  className="ml-auto"
                >
                  <Navigation className="h-4 w-4 mr-1" />
                  Use Current Location
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                    placeholder="e.g., -6.314992"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                    placeholder="e.g., 143.95555"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Set precise coordinates for map centering. Use "Current Location" if you're at the project site.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={editingProject ? saveProject : createProject}
                disabled={saving}
                className={editingProject ? "" : "bg-green-600 hover:bg-green-700"}
              >
                <Save className="h-4 w-4 mr-1" />
                {saving
                  ? (editingProject ? 'Saving...' : 'Creating...')
                  : (editingProject ? 'Save Changes' : 'Create Project')
                }
              </Button>
              <Button variant="outline" onClick={cancelEditing}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Loading projects...</p>
          </div>
        ) : (
          projects.map(project => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{project.name}</h3>
                      <Badge className={getStatusColor(project.status)}>
                        {getProjectStatusName(project.status)}
                      </Badge>
                      {project.latitude && project.longitude && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                          <MapPin className="h-3 w-3 mr-1" />
                          Located
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <strong>Province:</strong> {project.province?.name || 'Not assigned'}
                      </div>
                      <div>
                        <strong>Distance:</strong> {project.totalDistance ? `${(project.totalDistance / 1000).toFixed(1)}km` : 'Not specified'}
                      </div>
                      <div>
                        <strong>Coordinates:</strong> {
                          project.latitude && project.longitude
                            ? `${project.latitude.toFixed(4)}, ${project.longitude.toFixed(4)}`
                            : 'Not set'
                        }
                      </div>
                    </div>

                    {project.description && (
                      <p className="text-gray-600 mt-2 text-sm">{project.description}</p>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditing(project)}
                    disabled={editingProject?.id === project.id}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Project Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{projects.length}</div>
              <div className="text-sm text-gray-600">Total Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {projects.filter(p => p.latitude && p.longitude).length}
              </div>
              <div className="text-sm text-gray-600">With Coordinates</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {projects.filter(p => p.province).length}
              </div>
              <div className="text-sm text-gray-600">Province Assigned</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {projects.filter(p => p.status === 'IN_PROGRESS' || p.status === 'ACTIVE').length}
              </div>
              <div className="text-sm text-gray-600">Active Projects</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
