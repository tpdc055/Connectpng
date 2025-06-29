"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Edit, Save, AlertTriangle, Shield, Clock, CheckCircle,
  FileText, Users, MapPin, Search, Filter, Eye, Calendar,
  TrendingUp, BarChart3, Zap, Activity, Target, Settings
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  projectCode: string;
  province: string;
}

interface HSEIncident {
  id: string;
  incidentType: string;
  severity: string;
  description: string;
  incidentDate: string;
  location: string;
  personsInvolved: string[];
  rootCause?: string;
  investigation?: string;
  preventiveMeasures: string[];
  status: string;
  closureDate?: string;
  user: {
    name: string;
    role: string;
    position?: string;
  };
  hseRecord: {
    project: {
      name: string;
      projectCode: string;
    };
  };
  createdAt: string;
}

interface HSEStats {
  total: number;
  reported: number;
  investigating: number;
  resolved: number;
  closed: number;
  severityBreakdown: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  typeBreakdown: Record<string, number>;
}

interface HSEIncidentReporterProps {
  projectId: string;
}

export function HSEIncidentReporter({ projectId }: HSEIncidentReporterProps) {
  const [incidents, setIncidents] = useState<HSEIncident[]>([]);
  const [stats, setStats] = useState<HSEStats | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<HSEIncident | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    incidentType: 'INJURY',
    severity: 'MEDIUM',
    description: '',
    incidentDate: new Date().toISOString().split('T')[0],
    location: '',
    personsInvolved: '',
    rootCause: '',
    investigation: '',
    preventiveMeasures: '',
    status: 'REPORTED'
  });

  // Incident types and severity levels
  const incidentTypes = [
    { value: 'INJURY', label: 'Injury', icon: '🚑', color: 'bg-red-500' },
    { value: 'NEAR_MISS', label: 'Near Miss', icon: '⚠️', color: 'bg-yellow-500' },
    { value: 'ENVIRONMENTAL', label: 'Environmental', icon: '🌱', color: 'bg-green-500' },
    { value: 'SECURITY', label: 'Security', icon: '🔒', color: 'bg-blue-500' },
    { value: 'EQUIPMENT_DAMAGE', label: 'Equipment Damage', icon: '🔧', color: 'bg-orange-500' },
    { value: 'PROPERTY_DAMAGE', label: 'Property Damage', icon: '🏠', color: 'bg-purple-500' }
  ];

  const severityLevels = [
    { value: 'LOW', label: 'Low', color: 'bg-green-500 text-white', description: 'Minor incident, no injury' },
    { value: 'MEDIUM', label: 'Medium', color: 'bg-yellow-500 text-white', description: 'Moderate incident, minor injury' },
    { value: 'HIGH', label: 'High', color: 'bg-orange-500 text-white', description: 'Serious incident, significant injury' },
    { value: 'CRITICAL', label: 'Critical', color: 'bg-red-500 text-white', description: 'Life-threatening, major damage' }
  ];

  const statusOptions = [
    { value: 'REPORTED', label: 'Reported', color: 'bg-blue-500 text-white', icon: FileText },
    { value: 'INVESTIGATING', label: 'Investigating', color: 'bg-yellow-500 text-white', icon: Search },
    { value: 'RESOLVED', label: 'Resolved', color: 'bg-green-500 text-white', icon: CheckCircle },
    { value: 'CLOSED', label: 'Closed', color: 'bg-gray-500 text-white', icon: Shield }
  ];

  useEffect(() => {
    if (projectId) {
      fetchAllData();
    }
  }, [projectId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      // Fetch project details and incidents
      const [projectResponse, incidentsResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/hse-incidents?projectId=${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData.project);
      }

      if (incidentsResponse.ok) {
        const incidentsData = await incidentsResponse.json();
        setIncidents(incidentsData.incidents || []);
        setStats(incidentsData.stats);
      }

    } catch (error) {
      console.error('Error fetching HSE incidents:', error);
      setMessage({ type: 'error', text: 'Failed to load HSE incident data' });
    } finally {
      setLoading(false);
    }
  };

  const saveIncident = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');

      const incidentData = {
        projectId,
        incidentType: formData.incidentType,
        severity: formData.severity,
        description: formData.description,
        incidentDate: formData.incidentDate,
        location: formData.location,
        personsInvolved: formData.personsInvolved ? formData.personsInvolved.split('\n').filter(p => p.trim()) : [],
        rootCause: formData.rootCause || null,
        investigation: formData.investigation || null,
        preventiveMeasures: formData.preventiveMeasures ? formData.preventiveMeasures.split('\n').filter(p => p.trim()) : [],
        status: formData.status
      };

      const url = `/api/hse-incidents`;
      const method = editingIncident ? 'PUT' : 'POST';

      if (editingIncident) {
        (incidentData as any).id = editingIncident.id;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(incidentData)
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({
          type: 'success',
          text: editingIncident
            ? 'HSE incident updated successfully!'
            : `HSE incident reported successfully!${result.escalationRequired ? ' Management has been notified due to severity level.' : ''}`
        });
        await fetchAllData();
        setIsDialogOpen(false);
        resetForm();
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: `Failed to save incident: ${error}` });
      }
    } catch (error) {
      console.error('Error saving HSE incident:', error);
      setMessage({ type: 'error', text: 'Failed to save HSE incident' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingIncident(null);
    setFormData({
      incidentType: 'INJURY',
      severity: 'MEDIUM',
      description: '',
      incidentDate: new Date().toISOString().split('T')[0],
      location: '',
      personsInvolved: '',
      rootCause: '',
      investigation: '',
      preventiveMeasures: '',
      status: 'REPORTED'
    });
  };

  const getSeverityConfig = (severity: string) => {
    return severityLevels.find(s => s.value === severity) || severityLevels[1];
  };

  const getStatusConfig = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const getIncidentTypeConfig = (type: string) => {
    return incidentTypes.find(t => t.value === type) || incidentTypes[0];
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSeverity = selectedSeverity === "all" || incident.severity === selectedSeverity;
    const matchesStatus = selectedStatus === "all" || incident.status === selectedStatus;
    const matchesSearch = searchTerm === "" ||
      incident.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.incidentType.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSeverity && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p>Loading HSE incidents...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-red-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">HSE Incident Management</h2>
            <p className="text-gray-600">
              Health, Safety & Environment - {project?.name} ({project?.projectCode})
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-red-600 hover:bg-red-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                {editingIncident ? 'Update HSE Incident' : 'Report HSE Incident'}
              </DialogTitle>
              <DialogDescription>
                {editingIncident ? 'Update incident investigation and status' : 'Report a health, safety, or environmental incident'}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="incident" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="incident">Incident Details</TabsTrigger>
                <TabsTrigger value="investigation">Investigation & Response</TabsTrigger>
              </TabsList>

              <TabsContent value="incident" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="incidentType">Incident Type</Label>
                    <Select value={formData.incidentType} onValueChange={(value) => setFormData(prev => ({ ...prev, incidentType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {incidentTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <span>{type.icon}</span>
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="severity">Severity Level</Label>
                    <Select value={formData.severity} onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {severityLevels.map(level => (
                          <SelectItem key={level.value} value={level.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${level.color.split(' ')[0]}`}></div>
                              <div>
                                <div className="font-medium">{level.label}</div>
                                <div className="text-xs text-gray-600">{level.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="incidentDate">Incident Date</Label>
                    <Input
                      id="incidentDate"
                      type="date"
                      value={formData.incidentDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, incidentDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Specific location where incident occurred"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Incident Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of what happened"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="personsInvolved">Persons Involved (one per line)</Label>
                  <Textarea
                    id="personsInvolved"
                    value={formData.personsInvolved}
                    onChange={(e) => setFormData(prev => ({ ...prev, personsInvolved: e.target.value }))}
                    placeholder="John Smith - Site Supervisor&#10;Mary Jones - Equipment Operator"
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="investigation" className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">Investigation & Response</h4>
                  <p className="text-sm text-blue-700">Complete investigation details and preventive measures</p>
                </div>

                <div>
                  <Label htmlFor="rootCause">Root Cause Analysis</Label>
                  <Textarea
                    id="rootCause"
                    value={formData.rootCause}
                    onChange={(e) => setFormData(prev => ({ ...prev, rootCause: e.target.value }))}
                    placeholder="Analysis of the underlying cause of the incident"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="investigation">Investigation Findings</Label>
                  <Textarea
                    id="investigation"
                    value={formData.investigation}
                    onChange={(e) => setFormData(prev => ({ ...prev, investigation: e.target.value }))}
                    placeholder="Detailed investigation findings and observations"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="preventiveMeasures">Preventive Measures (one per line)</Label>
                  <Textarea
                    id="preventiveMeasures"
                    value={formData.preventiveMeasures}
                    onChange={(e) => setFormData(prev => ({ ...prev, preventiveMeasures: e.target.value }))}
                    placeholder="Additional safety training required&#10;Equipment maintenance schedule updated&#10;Safety procedures revised"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center gap-2">
                            <status.icon className="h-4 w-4" />
                            {status.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={saveIncident}
                disabled={saving || !formData.description || !formData.location}
                className="bg-red-600 hover:bg-red-700"
              >
                {saving ? 'Saving...' : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingIncident ? 'Update Incident' : 'Report Incident'}
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            {message.text}
          </div>
        </div>
      )}

      {/* Safety Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Incidents</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.reported}</div>
                  <div className="text-sm text-gray-600">Reported</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{stats.investigating}</div>
                  <div className="text-sm text-gray-600">Investigating</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                  <div className="text-sm text-gray-600">Resolved</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.severityBreakdown.high + stats.severityBreakdown.critical}</div>
                  <div className="text-sm text-gray-600">High/Critical</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">{stats.severityBreakdown.low + stats.severityBreakdown.medium}</div>
                  <div className="text-sm text-gray-600">Low/Medium</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {severityLevels.map(level => (
                  <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            HSE Incidents ({filteredIncidents.length})
          </CardTitle>
          <CardDescription>
            Safety incidents and environmental issues for {project?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {incidents.length === 0 ? 'No Incidents Reported' : 'No Matching Incidents'}
              </h3>
              <p className="text-gray-600 mb-4">
                {incidents.length === 0
                  ? 'Great safety record! No incidents have been reported yet.'
                  : 'No incidents match your current filters.'
                }
              </p>
              {incidents.length === 0 && (
                <Button onClick={() => setIsDialogOpen(true)} className="bg-red-600 hover:bg-red-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Report First Incident
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIncidents.map((incident) => {
                const severityConfig = getSeverityConfig(incident.severity);
                const statusConfig = getStatusConfig(incident.status);
                const typeConfig = getIncidentTypeConfig(incident.incidentType);

                return (
                  <div key={incident.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-lg">{typeConfig.icon}</span>
                          <h4 className="font-semibold text-lg">{typeConfig.label}</h4>
                          <Badge className={severityConfig.color}>
                            {severityConfig.label}
                          </Badge>
                          <Badge className={statusConfig.color}>
                            <statusConfig.icon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>

                        <p className="text-gray-700 mb-3">{incident.description}</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <div className="text-sm font-medium text-gray-700">Date & Location</div>
                            <div className="text-sm">
                              <div>{new Date(incident.incidentDate).toLocaleDateString()}</div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {incident.location}
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700">Reported By</div>
                            <div className="text-sm">
                              <div>{incident.user.name}</div>
                              <div className="text-gray-600">{incident.user.position || incident.user.role}</div>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700">Persons Involved</div>
                            <div className="text-sm">
                              {incident.personsInvolved.length > 0 ? (
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {incident.personsInvolved.length} person(s)
                                </div>
                              ) : (
                                'None specified'
                              )}
                            </div>
                          </div>
                        </div>

                        {incident.rootCause && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <div className="text-sm font-medium text-yellow-800">Root Cause:</div>
                            <div className="text-sm text-yellow-700">{incident.rootCause}</div>
                          </div>
                        )}

                        {incident.preventiveMeasures.length > 0 && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                            <div className="text-sm font-medium text-green-800">Preventive Measures:</div>
                            <ul className="text-sm text-green-700 list-disc list-inside">
                              {incident.preventiveMeasures.slice(0, 2).map((measure, index) => (
                                <li key={index}>{measure}</li>
                              ))}
                              {incident.preventiveMeasures.length > 2 && (
                                <li className="text-blue-600">+ {incident.preventiveMeasures.length - 2} more measures</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingIncident(incident);
                            setFormData({
                              incidentType: incident.incidentType,
                              severity: incident.severity,
                              description: incident.description,
                              incidentDate: incident.incidentDate.split('T')[0],
                              location: incident.location,
                              personsInvolved: incident.personsInvolved.join('\n'),
                              rootCause: incident.rootCause || '',
                              investigation: incident.investigation || '',
                              preventiveMeasures: incident.preventiveMeasures.join('\n'),
                              status: incident.status
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
