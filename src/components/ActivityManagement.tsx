"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, Users, Activity, Settings } from "lucide-react";

interface ConstructionActivity {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  createdBy: string;
  createdByUser: {
    name: string;
    email: string;
  };
  createdAt: string;
  _count?: {
    projectActivities: number;
    gpsPoints: number;
  };
}

export function ActivityManagement() {
  const [activities, setActivities] = useState<ConstructionActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newActivity, setNewActivity] = useState({
    name: "",
    description: "",
    color: "#3b82f6"
  });

  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      fetchActivities();
    }
  }, [isAdmin]);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/construction-activities', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
      } else {
        setError('Failed to fetch construction activities');
      }
    } catch (error) {
      setError('Error fetching activities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch('/api/construction-activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(newActivity),
      });

      if (response.ok) {
        setSuccess('Construction activity created successfully');
        setNewActivity({ name: "", description: "", color: "#3b82f6" });
        setIsCreateOpen(false);
        fetchActivities();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create activity');
      }
    } catch (error) {
      setError('Error creating activity');
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      const response = await fetch(`/api/construction-activities/${activityId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        setSuccess('Activity deleted successfully');
        fetchActivities();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete activity');
      }
    } catch (error) {
      setError('Error deleting activity');
    }
  };

  const colorOptions = [
    { value: "#3b82f6", label: "Blue", bg: "bg-blue-500" },
    { value: "#10b981", label: "Green", bg: "bg-green-500" },
    { value: "#f59e0b", label: "Orange", bg: "bg-orange-500" },
    { value: "#ef4444", label: "Red", bg: "bg-red-500" },
    { value: "#8b5cf6", label: "Purple", bg: "bg-purple-500" },
    { value: "#06b6d4", label: "Cyan", bg: "bg-cyan-500" },
    { value: "#84cc16", label: "Lime", bg: "bg-lime-500" },
    { value: "#f97316", label: "Orange", bg: "bg-orange-600" }
  ];

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Admin Access Required</h3>
            <p className="text-gray-600">You need administrator privileges to manage construction activities.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-6 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded shadow-sm"></div>
            <h2 className="text-3xl font-bold text-gray-900">Construction Activity Management</h2>
            <Badge variant="outline" className="bg-green-100 border-green-500 text-green-800">
              Dynamic System
            </Badge>
          </div>
          <p className="text-gray-600 mt-2">Create and manage custom construction activities for your projects</p>
          <div className="text-sm text-blue-600 bg-blue-50 border border-blue-200 rounded px-3 py-2 mt-3">
            <strong>🔧 User-Configurable:</strong> Add any type of construction activity - drainage, roads, bridges, buildings, etc.
          </div>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add New Activity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-6 h-4 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded"></div>
                Create Construction Activity
              </DialogTitle>
              <DialogDescription>
                Add a new type of construction activity that can be tracked and monitored.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateActivity} className="space-y-4">
              <div>
                <Label htmlFor="name">Activity Name</Label>
                <Input
                  id="name"
                  value={newActivity.name}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Line Drain Construction, Bridge Building, Road Sealing"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={newActivity.description}
                  onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this activity"
                />
              </div>
              <div>
                <Label htmlFor="color">Color Theme</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewActivity(prev => ({ ...prev, color: color.value }))}
                      className={`p-3 rounded-lg border-2 flex items-center justify-center ${
                        newActivity.color === color.value
                          ? 'border-gray-900 ring-2 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-6 h-6 ${color.bg} rounded-full`}></div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Activity</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))
        ) : activities.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Yet</h3>
            <p className="text-gray-600 mb-4">Create your first construction activity to get started</p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Activity
            </Button>
          </div>
        ) : (
          activities.map((activity) => (
            <Card key={activity.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: activity.color }}
                    ></div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{activity.name}</h3>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={activity.isActive ? "default" : "secondary"}>
                    {activity.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="font-medium text-blue-900">Projects</div>
                    <div className="text-blue-700">{activity._count?.projectActivities || 0}</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className="font-medium text-green-900">GPS Points</div>
                    <div className="text-green-700">{activity._count?.gpsPoints || 0}</div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  Created by {activity.createdByUser.name} on{" "}
                  {new Date(activity.createdAt).toLocaleDateString()}
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-red-300 hover:bg-red-50 text-red-600">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Activity</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{activity.name}"? This will also remove all associated project assignments and GPS points. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteActivity(activity.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
