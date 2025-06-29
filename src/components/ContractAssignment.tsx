"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, DollarSign, Calendar, Building, Plus, Edit, Star, CheckCircle, AlertCircle } from "lucide-react";

interface Project {
  id: string;
  name: string;
}

interface Contractor {
  id: string;
  name: string;
  licenseNumber?: string;
  certificationLevel?: string;
  isActive: boolean;
}

interface ContractAssignment {
  id?: string;
  contractorId: string;
  contractor: Contractor;
  project: Project;
  contractValue?: number;
  contractStartDate?: string;
  contractEndDate?: string;
  performanceBond?: number;
  contractStatus: string;
  performanceRating?: number;
  sections: string[];
}

// ✅ Dynamic interface - no more hardcoding!
interface ContractStatus {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

interface ContractAssignmentProps {
  projectId?: string;
}

export function ContractAssignment({ projectId }: ContractAssignmentProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [assignments, setAssignments] = useState<ContractAssignment[]>([]);
  const [contractStatuses, setContractStatuses] = useState<ContractStatus[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>(projectId || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<ContractAssignment | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    contractorId: '',
    contractValue: '',
    contractStartDate: '',
    contractEndDate: '',
    performanceBond: '',
    contractStatus: 'ACTIVE',
    performanceRating: '',
    sections: [] as string[]
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchProjectAssignments();
    }
  }, [selectedProject]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      // Fetch projects, contractors, and lookup data in parallel
      const [projectsResponse, contractorsResponse, lookupResponse] = await Promise.all([
        fetch('/api/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/contractors', {
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

      if (contractorsResponse.ok) {
        const contractorsData = await contractorsResponse.json();
        setContractors(contractorsData.contractors.filter((c: Contractor) => c.isActive) || []);
      }

      if (lookupResponse.ok) {
        const lookupData = await lookupResponse.json();
        setContractStatuses(lookupData.contractStatuses || []);
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

  const fetchProjectAssignments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/projects/${selectedProject}/contractors`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments(data.contractorAssignments || []);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const openCreateDialog = () => {
    setEditingAssignment(null);
    setFormData({
      contractorId: '', contractValue: '', contractStartDate: '', contractEndDate: '',
      performanceBond: '', contractStatus: 'ACTIVE', performanceRating: '', sections: []
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (assignment: ContractAssignment) => {
    setEditingAssignment(assignment);
    setFormData({
      contractorId: assignment.contractorId,
      contractValue: assignment.contractValue?.toString() || '',
      contractStartDate: assignment.contractStartDate?.split('T')[0] || '',
      contractEndDate: assignment.contractEndDate?.split('T')[0] || '',
      performanceBond: assignment.performanceBond?.toString() || '',
      contractStatus: assignment.contractStatus,
      performanceRating: assignment.performanceRating?.toString() || '',
      sections: assignment.sections || []
    });
    setIsDialogOpen(true);
  };

  const saveAssignment = async () => {
    if (!selectedProject || !formData.contractorId) {
      setMessage({ type: 'error', text: 'Please select project and contractor' });
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');

      const saveData = {
        contractorId: formData.contractorId,
        contractValue: formData.contractValue ? Number(formData.contractValue) : null,
        contractStartDate: formData.contractStartDate || null,
        contractEndDate: formData.contractEndDate || null,
        performanceBond: formData.performanceBond ? Number(formData.performanceBond) : null,
        contractStatus: formData.contractStatus,
        performanceRating: formData.performanceRating ? Number(formData.performanceRating) : null,
        sections: formData.sections
      };

      const method = editingAssignment ? 'PUT' : 'POST';
      const response = await fetch(`/api/projects/${selectedProject}/contractors`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(saveData)
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: editingAssignment ? 'Contract updated successfully!' : 'Contractor assigned successfully!'
        });
        await fetchProjectAssignments();
        setIsDialogOpen(false);
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: `Failed to save: ${error}` });
      }
    } catch (error) {
      console.error('Error saving assignment:', error);
      setMessage({ type: 'error', text: 'Failed to save assignment' });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (statusId: string) => {
    const status = contractStatuses.find(s => s.id === statusId);
    if (status?.color) {
      // Use the dynamic color from database
      return `bg-gray-100 text-gray-800`; // Default while we implement proper color handling
    }

    // Fallback based on status name
    const statusName = status?.name?.toUpperCase();
    switch (statusName) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'SUSPENDED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'TERMINATED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusName = (statusId: string) => {
    const status = contractStatuses.find(s => s.id === statusId);
    return status?.name || statusId;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PGK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const clearMessage = () => {
    setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => {
    if (message) clearMessage();
  }, [message]);

  const totalContractValue = assignments.reduce((sum, assignment) =>
    sum + (assignment.contractValue || 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-purple-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Contract Assignments</h2>
            <p className="text-gray-600">Assign contractors to projects and manage contract values</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreateDialog}
              disabled={!selectedProject}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Assign Contractor
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAssignment ? 'Edit Contract Assignment' : 'Assign Contractor to Project'}
              </DialogTitle>
              <DialogDescription>
                Set contract details and assign a contractor to the selected project
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contractor">Contractor *</Label>
                  <Select
                    value={formData.contractorId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, contractorId: value }))}
                    disabled={!!editingAssignment}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select contractor" />
                    </SelectTrigger>
                    <SelectContent>
                      {contractors.map(contractor => (
                        <SelectItem key={contractor.id} value={contractor.id}>
                          {contractor.name} ({contractor.licenseNumber || 'No License'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="contractValue">Contract Value (PGK)</Label>
                  <Input
                    id="contractValue"
                    type="number"
                    value={formData.contractValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractValue: e.target.value }))}
                    placeholder="1000000"
                  />
                </div>

                <div>
                  <Label htmlFor="contractStartDate">Start Date</Label>
                  <Input
                    id="contractStartDate"
                    type="date"
                    value={formData.contractStartDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractStartDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="contractEndDate">End Date</Label>
                  <Input
                    id="contractEndDate"
                    type="date"
                    value={formData.contractEndDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractEndDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="performanceBond">Performance Bond (PGK)</Label>
                  <Input
                    id="performanceBond"
                    type="number"
                    value={formData.performanceBond}
                    onChange={(e) => setFormData(prev => ({ ...prev, performanceBond: e.target.value }))}
                    placeholder="100000"
                  />
                </div>

                <div>
                  <Label htmlFor="contractStatus">Contract Status</Label>
                  <Select
                    value={formData.contractStatus}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, contractStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contractStatuses.map(status => (
                        <SelectItem key={status.id} value={status.id} title={status.description}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {editingAssignment && (
                  <div>
                    <Label htmlFor="performanceRating">Performance Rating (1-10)</Label>
                    <Input
                      id="performanceRating"
                      type="number"
                      min="1"
                      max="10"
                      value={formData.performanceRating}
                      onChange={(e) => setFormData(prev => ({ ...prev, performanceRating: e.target.value }))}
                      placeholder="8"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={saveAssignment}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {saving ? 'Saving...' : (editingAssignment ? 'Update Contract' : 'Assign Contractor')}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Project</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a project to manage contracts" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

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

      {/* Contract Assignments */}
      {selectedProject && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{assignments.length}</div>
                  <div className="text-sm text-gray-600">Total Contractors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {assignments.filter(a => a.contractStatus === 'ACTIVE').length}
                  </div>
                  <div className="text-sm text-gray-600">Active Contracts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalContractValue)}
                  </div>
                  <div className="text-sm text-gray-600">Total Contract Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {assignments.filter(a => a.performanceRating).length > 0
                      ? (assignments
                          .filter(a => a.performanceRating)
                          .reduce((sum, a) => sum + (a.performanceRating || 0), 0) /
                        assignments.filter(a => a.performanceRating).length).toFixed(1)
                      : 'N/A'
                    }
                  </div>
                  <div className="text-sm text-gray-600">Avg. Performance</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignments List */}
          <div className="grid gap-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p>Loading assignments...</p>
              </div>
            ) : assignments.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Contractors Assigned</h3>
                  <p className="text-gray-600 mb-4">Assign contractors to this project to get started</p>
                  <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Assign First Contractor
                  </Button>
                </CardContent>
              </Card>
            ) : (
              assignments.map(assignment => (
                <Card key={assignment.contractor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{assignment.contractor.name}</h3>
                          <Badge className={getStatusColor(assignment.contractStatus)}>
                            {getStatusName(assignment.contractStatus)}
                          </Badge>
                          {assignment.contractor.certificationLevel && (
                            <Badge variant="outline">{assignment.contractor.certificationLevel}</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span>{assignment.contractValue ? formatCurrency(assignment.contractValue) : 'No value set'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span>
                              {assignment.contractStartDate
                                ? new Date(assignment.contractStartDate).toLocaleDateString()
                                : 'No start date'
                              }
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4 text-purple-600" />
                            <span>License: {assignment.contractor.licenseNumber || 'None'}</span>
                          </div>
                          {assignment.performanceRating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-600" />
                              <span>{assignment.performanceRating}/10 rating</span>
                            </div>
                          )}
                        </div>

                        {assignment.contractEndDate && (
                          <div className="mt-2 text-sm text-gray-600">
                            <strong>End Date:</strong> {new Date(assignment.contractEndDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(assignment)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit Contract
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
