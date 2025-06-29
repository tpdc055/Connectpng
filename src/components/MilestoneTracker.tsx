"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Plus, Edit, Save, Calendar, CheckCircle, Clock, AlertTriangle,
  Target, Flag, Building, FileCheck, Truck, HardHat, Clipboard
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  projectCode: string;
  province: string;
}

interface MilestoneUpdate {
  id: string;
  previousStatus: string;
  newStatus: string;
  notes?: string;
  createdAt: string;
  user: {
    name: string;
    role: string;
  };
}

interface Milestone {
  id: string;
  milestoneName: string;
  description?: string;
  category: string;
  plannedDate: string;
  actualDate?: string;
  status: string;
  project: {
    name: string;
    projectCode: string;
  };
  updates: MilestoneUpdate[];
  createdAt: string;
}

interface MilestoneStats {
  total: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  delayed: number;
  completionRate: number;
}

interface MilestoneTrackerProps {
  projectId: string;
}

export function MilestoneTracker({ projectId }: MilestoneTrackerProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [stats, setStats] = useState<MilestoneStats | null>(null);
  const [milestonesByCategory, setMilestonesByCategory] = useState<Record<string, Milestone[]>>({});
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    milestoneName: '',
    description: '',
    category: 'DESIGN_COMPLETION',
    plannedDate: '',
    actualDate: '',
    status: 'NOT_STARTED',
    updateNotes: ''
  });

  // Dynamic milestone categories and statuses from database
  const [milestoneCategories, setMilestoneCategories] = useState<any[]>([]);
  const [milestoneStatuses, setMilestoneStatuses] = useState<any[]>([]);



  useEffect(() => {
    if (projectId) {
      fetchAllData();
    }
  }, [projectId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      // Fetch project details, milestones, and lookup data
      const [projectResponse, milestonesResponse, lookupResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/milestones?projectId=${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/lookup', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData.project);
      }

      if (milestonesResponse.ok) {
        const milestonesData = await milestonesResponse.json();
        setMilestones(milestonesData.milestones || []);
        setStats(milestonesData.stats);
        setMilestonesByCategory(milestonesData.milestonesByCategory || {});
      }

      if (lookupResponse.ok) {
        const lookupData = await lookupResponse.json();
        setMilestoneCategories(lookupData.milestoneCategories || []);
        setMilestoneStatuses(lookupData.milestoneStatuses || []);
      }

    } catch (error) {
      console.error('Error fetching milestones:', error);
      setMessage({ type: 'error', text: 'Failed to load milestone data' });
    } finally {
      setLoading(false);
    }
  };

  const saveMilestone = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');

      const milestoneData = {
        projectId,
        milestoneName: formData.milestoneName,
        description: formData.description || null,
        category: formData.category,
        plannedDate: formData.plannedDate,
        actualDate: formData.actualDate || null,
        status: formData.status,
        updateNotes: formData.updateNotes || null
      };

      const url = `/api/milestones`;
      const method = editingMilestone ? 'PUT' : 'POST';

      if (editingMilestone) {
        (milestoneData as any).id = editingMilestone.id;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(milestoneData)
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: editingMilestone ? 'Milestone updated successfully!' : 'Milestone created successfully!'
        });
        await fetchAllData();
        setIsDialogOpen(false);
        resetForm();
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: `Failed to save milestone: ${error}` });
      }
    } catch (error) {
      console.error('Error saving milestone:', error);
      setMessage({ type: 'error', text: 'Failed to save milestone' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingMilestone(null);
    setFormData({
      milestoneName: '',
      description: '',
      category: milestoneCategories.length > 0 ? milestoneCategories[0].id : '',
      plannedDate: '',
      actualDate: '',
      status: milestoneStatuses.length > 0 ? milestoneStatuses[0].code : '',
      updateNotes: ''
    });
  };

  const getCategoryConfig = (categoryId: string) => {
    return milestoneCategories.find(cat => cat.id === categoryId) || milestoneCategories[0];
  };

  const getStatusStyle = (statusCode: string) => {
    const statusConfig = milestoneStatuses.find(s => s.code === statusCode);
    return {
      backgroundColor: statusConfig?.color || '#6B7280',
      color: 'white'
    };
  };

  const isOverdue = (milestone: Milestone) => {
    if (milestone.status === 'COMPLETED') return false;
    const plannedDate = new Date(milestone.plannedDate);
    const today = new Date();
    return plannedDate < today;
  };

  const getDaysFromPlanned = (milestone: Milestone) => {
    const plannedDate = new Date(milestone.plannedDate);
    const compareDate = milestone.actualDate ? new Date(milestone.actualDate) : new Date();
    const diffTime = compareDate.getTime() - plannedDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredMilestones = selectedCategory === "all"
    ? milestones
    : milestones.filter(m => m.categoryId === selectedCategory);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading milestones...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Milestone Tracking</h2>
            <p className="text-gray-600">
              {project?.name} ({project?.projectCode})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {milestoneCategories.map(category => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingMilestone ? 'Edit Milestone' : 'Add Milestone'}
                </DialogTitle>
                <DialogDescription>
                  Track key milestones for project phases
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="milestoneName">Milestone Name</Label>
                  <Input
                    id="milestoneName"
                    value={formData.milestoneName}
                    onChange={(e) => setFormData(prev => ({ ...prev, milestoneName: e.target.value }))}
                    placeholder="Enter milestone name"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {milestoneCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="plannedDate">Planned Date</Label>
                    <Input
                      id="plannedDate"
                      type="date"
                      value={formData.plannedDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, plannedDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="actualDate">Actual Date (if completed)</Label>
                    <Input
                      id="actualDate"
                      type="date"
                      value={formData.actualDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, actualDate: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {milestoneStatuses.map(status => (
                        <SelectItem key={status.id} value={status.code}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Milestone description and details"
                    rows={3}
                  />
                </div>

                {editingMilestone && (
                  <div>
                    <Label htmlFor="updateNotes">Update Notes</Label>
                    <Textarea
                      id="updateNotes"
                      value={formData.updateNotes}
                      onChange={(e) => setFormData(prev => ({ ...prev, updateNotes: e.target.value }))}
                      placeholder="Notes about this update"
                      rows={2}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={saveMilestone}
                  disabled={saving || !formData.milestoneName || !formData.plannedDate}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saving ? 'Saving...' : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {editingMilestone ? 'Update Milestone' : 'Create Milestone'}
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

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-600">{stats.notStarted}</div>
                  <div className="text-sm text-gray-600">Not Started</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                  <div className="text-sm text-gray-600">In Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.delayed}</div>
                  <div className="text-sm text-gray-600">Delayed</div>
                </div>
              </div>
              <Progress value={stats.completionRate} className="h-1 mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Milestone Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Project Milestones Timeline
          </CardTitle>
          <CardDescription>
            Track key milestones for {project?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMilestones.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Milestones</h3>
              <p className="text-gray-600 mb-4">Create your first milestone to start tracking project phases.</p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create First Milestone
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMilestones.map((milestone) => {
                const categoryConfig = getCategoryConfig(milestone.category);
                const isDelayed = isOverdue(milestone);
                const daysDiff = getDaysFromPlanned(milestone);

                return (
                  <div key={milestone.id} className="relative border rounded-lg p-4 hover:bg-gray-50">
                    {/* Timeline connector */}
                    <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200"></div>

                    <div className="flex items-start gap-4">
                      {/* Category Icon */}
                      <div className={`w-12 h-12 rounded-full ${categoryConfig.color} flex items-center justify-center text-white z-10 relative`}>
                        {categoryConfig.icon}
                      </div>

                      {/* Milestone Content */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-lg">{milestone.milestoneName}</h4>
                            <p className="text-sm text-gray-600">{categoryConfig.label}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge style={getStatusStyle(milestone.status)}>
                              <span className="ml-1">{milestoneStatuses.find(s => s.code === milestone.status)?.name || milestone.status.replace('_', ' ')}</span>
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingMilestone(milestone);
                                setFormData({
                                  milestoneName: milestone.milestoneName,
                                  description: milestone.description || '',
                                  category: milestone.category,
                                  plannedDate: milestone.plannedDate.split('T')[0],
                                  actualDate: milestone.actualDate?.split('T')[0] || '',
                                  status: milestone.status,
                                  updateNotes: ''
                                });
                                setIsDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {milestone.description && (
                          <p className="text-gray-700 mb-3">{milestone.description}</p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <div className="text-sm font-medium text-gray-700">Planned Date</div>
                            <div className="text-sm">{new Date(milestone.plannedDate).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700">Actual Date</div>
                            <div className="text-sm">
                              {milestone.actualDate
                                ? new Date(milestone.actualDate).toLocaleDateString()
                                : 'Not completed'
                              }
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700">Timeline</div>
                            <div className={`text-sm ${daysDiff > 0 && milestone.status !== 'COMPLETED' ? 'text-red-600' : 'text-green-600'}`}>
                              {milestone.status === 'COMPLETED'
                                ? daysDiff >= 0
                                  ? `Completed ${daysDiff} days after planned`
                                  : `Completed ${Math.abs(daysDiff)} days early`
                                : daysDiff > 0
                                  ? `${daysDiff} days overdue`
                                  : `${Math.abs(daysDiff)} days until due`
                              }
                            </div>
                          </div>
                        </div>

                        {isDelayed && milestone.status !== 'COMPLETED' && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                            <AlertTriangle className="inline h-4 w-4 mr-1" />
                            This milestone is overdue
                          </div>
                        )}

                        {milestone.updates && milestone.updates.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-sm font-medium text-gray-700 mb-2">Recent Updates</div>
                            <div className="space-y-1">
                              {milestone.updates.slice(0, 2).map((update) => (
                                <div key={update.id} className="text-sm flex items-center justify-between">
                                  <span>{update.previousStatus} → {update.newStatus}</span>
                                  <span className="text-gray-500">
                                    {new Date(update.createdAt).toLocaleDateString()} by {update.user.name}
                                  </span>
                                </div>
                              ))}
                              {milestone.updates.length > 2 && (
                                <div className="text-sm text-blue-600">+ {milestone.updates.length - 2} more updates</div>
                              )}
                            </div>
                          </div>
                        )}
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
