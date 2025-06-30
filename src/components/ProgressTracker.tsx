"use client";

import { useState } from "react";
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
  Calendar
} from "lucide-react";

interface ProgressTrackerProps {
  activePhase: string;
  projectId?: string;
}

export function ProgressTracker({ activePhase, projectId }: ProgressTrackerProps) {
  const [isTracking, setIsTracking] = useState(false);

  // Mock progress data for demonstration
  const phaseData = {
    drain: {
      title: "Line Drain Construction",
      description: "Construction of drainage systems along the road sides",
      color: "blue",
      progress: 40,
      status: "IN_PROGRESS",
      startDate: "2024-01-15",
      estimatedEnd: "2024-04-15",
      tasks: [
        { name: "Left side drainage", progress: 60, status: "IN_PROGRESS" },
        { name: "Right side drainage", progress: 35, status: "IN_PROGRESS" },
        { name: "Cross drainage", progress: 25, status: "PLANNED" },
        { name: "Quality inspection", progress: 0, status: "PLANNED" }
      ],
      team: { lead: "Emmanuel Mabi", engineers: 2, workers: 8 },
      gpsPoints: 67,
      distance: 6000 // meters
    },
    basket: {
      title: "Basket Construction",
      description: "Installation of basket structures following line drains",
      color: "green",
      progress: 15,
      status: "PLANNED",
      startDate: "2024-03-01",
      estimatedEnd: "2024-08-15",
      tasks: [
        { name: "Material procurement", progress: 80, status: "IN_PROGRESS" },
        { name: "Left side baskets", progress: 0, status: "PLANNED" },
        { name: "Right side baskets", progress: 0, status: "PLANNED" },
        { name: "Connection to drains", progress: 0, status: "PLANNED" }
      ],
      team: { lead: "Emmanuel Mabi", engineers: 2, workers: 12 },
      gpsPoints: 23,
      distance: 2250
    },
    sealing: {
      title: "Road Sealing",
      description: "Final road surface sealing and finishing",
      color: "red",
      progress: 0,
      status: "PLANNED",
      startDate: "2024-07-01",
      estimatedEnd: "2024-12-15",
      tasks: [
        { name: "Surface preparation", progress: 0, status: "PLANNED" },
        { name: "Base layer application", progress: 0, status: "PLANNED" },
        { name: "Final sealing", progress: 0, status: "PLANNED" },
        { name: "Road marking", progress: 0, status: "PLANNED" }
      ],
      team: { lead: "Emmanuel Mabi", engineers: 3, workers: 15 },
      gpsPoints: 0,
      distance: 0
    }
  };

  const currentPhase = phaseData[activePhase as keyof typeof phaseData];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'IN_PROGRESS': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'PLANNED': return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-50 border-green-200 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'PLANNED': return 'bg-gray-50 border-gray-200 text-gray-600';
      default: return 'bg-gray-50 border-gray-200 text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleTracking = () => {
    setIsTracking(!isTracking);
  };

  if (!currentPhase) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>Invalid phase selected</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Phase Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-4 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded-sm"></div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress Tracker
            </CardTitle>
          </div>
          <CardDescription>
            Real-time tracking for {currentPhase.title}
          </CardDescription>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={`bg-${currentPhase.color}-50 border-${currentPhase.color}-300 text-${currentPhase.color}-800`}
            >
              {currentPhase.title}
            </Badge>
            <Badge
              variant="outline"
              className={getStatusColor(currentPhase.status)}
            >
              {getStatusIcon(currentPhase.status)}
              <span className="ml-1">{currentPhase.status.replace('_', ' ')}</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Overall Phase Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Phase Progress</span>
              <span className="text-sm text-gray-600">{currentPhase.progress}%</span>
            </div>
            <Progress value={currentPhase.progress} className="h-3" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{currentPhase.distance}m completed</span>
              <span>15,000m total</span>
            </div>
          </div>

          {/* Phase Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-500 mb-1">Start Date</div>
              <div className="font-medium">{formatDate(currentPhase.startDate)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Est. Completion</div>
              <div className="font-medium">{formatDate(currentPhase.estimatedEnd)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Team Lead</div>
              <div className="font-medium">{currentPhase.team.lead}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">GPS Points</div>
              <div className="font-medium">{currentPhase.gpsPoints} recorded</div>
            </div>
          </div>

          {/* Tracking Controls */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant={isTracking ? "destructive" : "default"}
              size="sm"
              onClick={toggleTracking}
              className="flex-1"
            >
              {isTracking ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Tracking
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Tracking
                </>
              )}
            </Button>
            <Button variant="outline" size="sm">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Task Breakdown</CardTitle>
          <CardDescription>
            Individual task progress for {currentPhase.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentPhase.tasks.map((task, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(task.status)}
                  <span className="text-sm font-medium text-gray-700">{task.name}</span>
                </div>
                <span className="text-sm text-gray-600">{task.progress}%</span>
              </div>
              <Progress value={task.progress} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Team Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Information
          </CardTitle>
          <CardDescription>
            Current team assigned to {currentPhase.title}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-lg font-bold text-blue-800">{currentPhase.team.engineers}</div>
              <div className="text-xs text-blue-600">Engineers</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="text-lg font-bold text-green-800">{currentPhase.team.workers}</div>
              <div className="text-xs text-green-600">Workers</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-lg font-bold text-purple-800">{currentPhase.gpsPoints}</div>
              <div className="text-xs text-purple-600">GPS Points</div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-700 mb-1">Team Lead</div>
            <div className="text-sm text-gray-600">{currentPhase.team.lead}</div>
            <div className="text-xs text-gray-500 mt-2">
              Responsible for overseeing {currentPhase.title.toLowerCase()} operations
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest updates for {currentPhase.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Mock activity items */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="flex-1 text-sm">
                <div className="font-medium text-blue-800">GPS Point Added</div>
                <div className="text-blue-700">New coordinate recorded at 2.5km mark</div>
                <div className="text-xs text-blue-600 mt-1">2 hours ago by {currentPhase.team.lead}</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="flex-1 text-sm">
                <div className="font-medium text-green-800">Quality Check Passed</div>
                <div className="text-green-700">Section inspection completed successfully</div>
                <div className="text-xs text-green-600 mt-1">1 day ago</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="flex-1 text-sm">
                <div className="font-medium text-yellow-800">Status Update</div>
                <div className="text-yellow-700">Phase progress updated to {currentPhase.progress}%</div>
                <div className="text-xs text-yellow-600 mt-1">3 days ago</div>
              </div>
            </div>
          </div>

          {/* Development Notice */}
          <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-gray-500 mt-0.5" />
              <div className="text-xs text-gray-600">
                <div className="font-medium mb-1">Real-time Activity Feed</div>
                <div>Activity tracking will be populated from live project data and user actions.</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PNG Branding Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded-sm"></div>
            <span>Infrastructure Program</span>
          </div>
          <span>Infrastructure Development</span>
        </div>
      </div>
    </div>
  );
}
