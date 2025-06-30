"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  Activity
} from "lucide-react";

interface ProjectActivity {
  id: string;
  activity: {
    id: string;
    name: string;
    description?: string;
    color: string;
  };
  assignedUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  status: string;
  progress: number;
  startDate?: string;
  estimatedEndDate?: string;
  actualEndDate?: string;
  totalLength?: number;
  completedLength?: number;
  estimatedHours?: number;
  actualHours?: number;
  priority: string;
  notes?: string;
  _count: {
    tasks: number;
    activities: number;
  };
  tasks: Array<{
    id: string;
    name: string;
    status: string;
    progress: number;
    assignedUser?: {
      name: string;
    };
  }>;
}

interface DynamicProgressTrackerProps {
  projectId?: string;
  selectedActivityId?: string;
}

export function DynamicProgressTracker({ projectId, selectedActivityId }: DynamicProgressTrackerProps) {
  const [projectActivities, setProjectActivities] = useState<ProjectActivity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<ProjectActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (projectId) {
      fetchProjectActivities();
    }
  }, [projectId]);

  useEffect(() => {
    if (selectedActivityId && projectActivities.length > 0) {
      const activity = projectActivities.find(a => a.activity.id === selectedActivityId);
      setSelectedActivity(activity || projectActivities[0]);
    } else if (projectActivities.length > 0) {
      setSelectedActivity(projectActivities[0]);
    }
  }, [selectedActivityId, projectActivities]);

  const fetchProjectActivities = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/${projectId}/activities`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjectActivities(data.activities || []);
      } else {
        setError('Failed to fetch project activities');
      }
    } catch (error) {
      setError('Error fetching project activities');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'IN_PROGRESS': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'PLANNED': return <AlertCircle className="h-4 w-4 text-gray-400" />;
      case 'ON_HOLD': return <Pause className="h-4 w-4 text-yellow-500" />;
      case 'CANCELLED': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-50 border-green-200 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'PLANNED': return 'bg-gray-50 border-gray-200 text-gray-600';
      case 'ON_HOLD': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'CANCELLED': return 'bg-red-50 border-red-200 text-red-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-300';
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
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Activities</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchProjectActivities}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (projectActivities.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Configured</h3>
            <p className="text-gray-600 mb-4">Add construction activities to start tracking progress</p>
            {user?.role === 'ADMIN' && (
              <Button>
                <Play className="h-4 w-4 mr-2" />
                Configure Activities
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Selection */}
      {projectActivities.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Activity to Track</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {projectActivities.map((activity) => (
                <button
                  key={activity.id}
                  onClick={() => setSelectedActivity(activity)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedActivity?.id === activity.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: activity.activity.color }}
                    ></div>
                    <div className="flex-1">
                      <div className="font-medium">{activity.activity.name}</div>
                      <div className="text-sm text-gray-500">
                        {activity.progress}% complete • {activity.status}
                      </div>
                    </div>
                    {getStatusIcon(activity.status)}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Activity Progress */}
      {selectedActivity && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-6 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded shadow-sm"></div>
              <TrendingUp className="h-5 w-5" />
              <CardTitle>Progress Tracker</CardTitle>
            </div>
            <CardDescription>
              Real-time tracking for {selectedActivity.activity.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Activity Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedActivity.activity.color }}
                ></div>
                <h3 className="text-lg font-semibold">{selectedActivity.activity.name}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`border ${getStatusColor(selectedActivity.status)}`}>
                  {getStatusIcon(selectedActivity.status)}
                  <span className="ml-1">{selectedActivity.status.replace('_', ' ')}</span>
                </Badge>
                <Badge variant="outline" className={getPriorityColor(selectedActivity.priority)}>
                  {selectedActivity.priority}
                </Badge>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm font-medium mb-2">
                <span>Phase Progress</span>
                <span>{selectedActivity.progress}%</span>
              </div>
              <Progress value={selectedActivity.progress} className="h-3" />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>
                  {selectedActivity.completedLength
                    ? `${selectedActivity.completedLength}m completed`
                    : `${selectedActivity.actualHours || 0}h worked`
                  }
                </span>
                <span>
                  {selectedActivity.totalLength
                    ? `${selectedActivity.totalLength}m total`
                    : `${selectedActivity.estimatedHours || 0}h estimated`
                  }
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-gray-700 mb-1">Start Date</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    {selectedActivity.startDate
                      ? new Date(selectedActivity.startDate).toLocaleDateString()
                      : 'Not started'
                    }
                  </span>
                </div>
              </div>
              <div>
                <div className="font-medium text-gray-700 mb-1">Est. Completion</div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>
                    {selectedActivity.estimatedEndDate
                      ? new Date(selectedActivity.estimatedEndDate).toLocaleDateString()
                      : 'TBD'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Team Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-gray-600" />
                <h4 className="font-semibold text-gray-800">Team Information</h4>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Team Lead */}
                <div className="bg-blue-50 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-blue-700">1</div>
                  <div className="text-sm font-medium text-blue-900">Team Lead</div>
                </div>
                {/* Workers */}
                <div className="bg-green-50 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-green-700">
                    {selectedActivity._count?.tasks || 0}
                  </div>
                  <div className="text-sm font-medium text-green-900">Active Tasks</div>
                </div>
                {/* GPS Points */}
                <div className="bg-purple-50 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-purple-700">
                    {selectedActivity._count?.activities || 0}
                  </div>
                  <div className="text-sm font-medium text-purple-900">Updates</div>
                </div>
              </div>

              {/* Team Lead Info */}
              {selectedActivity.assignedUser && (
                <div className="mt-4 p-3 bg-white rounded border">
                  <div className="font-medium text-gray-700 mb-1">Team Lead</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {selectedActivity.assignedUser.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {selectedActivity.assignedUser.email} • {selectedActivity.assignedUser.role}
                  </div>
                </div>
              )}
            </div>

            {/* Task Breakdown */}
            {selectedActivity.tasks && selectedActivity.tasks.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Task Breakdown</h4>
                <div className="space-y-2">
                  {selectedActivity.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(task.status)}
                        <div>
                          <div className="font-medium">{task.name}</div>
                          {task.assignedUser && (
                            <div className="text-sm text-gray-600">
                              Assigned to {task.assignedUser.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{task.progress}%</div>
                        <div className="text-sm text-gray-500">{task.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedActivity.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Notes</h4>
                <p className="text-yellow-800">{selectedActivity.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
