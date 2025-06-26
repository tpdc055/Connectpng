"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  MapPin,
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";

import type { Project } from '@/types';

interface ProjectStatsProps {
  projectData?: Project | null;
}

export function ProjectStats({ projectData }: ProjectStatsProps) {
  // Mock data for demonstration
  const mockStats = {
    totalDistance: 15000, // 15km in meters
    completedDistance: 3750, // 25% completed
    phases: {
      drain: { completed: 40, total: 100, status: 'IN_PROGRESS' },
      basket: { completed: 15, total: 100, status: 'PLANNED' },
      sealing: { completed: 0, total: 100, status: 'PLANNED' }
    },
    team: {
      engineers: 4,
      supervisors: 2,
      managers: 1,
      totalWorkers: 25
    },
    timeline: {
      startDate: '2024-01-15',
      plannedEndDate: '2024-12-15',
      currentProgress: 25
    },
    budget: {
      allocated: 2500000, // PGK
      spent: 625000,
      currency: 'PGK'
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'drain': return 'blue';
      case 'basket': return 'green';
      case 'sealing': return 'red';
      default: return 'gray';
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'drain': return 'Line Drain';
      case 'basket': return 'Basket Construction';
      case 'sealing': return 'Road Sealing';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'IN_PROGRESS': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'PLANNED': return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatCurrency = (amount: number, currency = 'PGK') => {
    return new Intl.NumberFormat('en-PG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Project Overview Card */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-6 h-4 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded-sm"></div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Project Overview
            </CardTitle>
          </div>
          <CardDescription>
            Maria Pori Road Construction Progress - ITCFA Exxon Mobile Project
          </CardDescription>
          <Badge variant="outline" className="w-fit bg-yellow-50 border-yellow-400 text-yellow-800">
            Central Province, PNG
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-600">{mockStats.timeline.currentProgress}%</span>
            </div>
            <Progress value={mockStats.timeline.currentProgress} className="h-3" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>{mockStats.completedDistance}m completed</span>
              <span>{mockStats.totalDistance}m total</span>
            </div>
          </div>

          {/* Phase Progress */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Construction Phases</h4>
            {Object.entries(mockStats.phases).map(([phase, data]) => (
              <div key={phase} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 bg-${getPhaseColor(phase)}-500 rounded-full`}></div>
                    <span className="text-sm text-gray-700">{getPhaseLabel(phase)}</span>
                    {getStatusIcon(data.status)}
                  </div>
                  <span className="text-sm text-gray-600">{data.completed}%</span>
                </div>
                <Progress value={data.completed} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team
          </CardTitle>
          <CardDescription>
            Project workforce overview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Engineers</span>
              <Badge variant="secondary">{mockStats.team.engineers}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Supervisors</span>
              <Badge variant="secondary">{mockStats.team.supervisors}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Managers</span>
              <Badge variant="secondary">{mockStats.team.managers}</Badge>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Total Workers</span>
                <Badge className="bg-blue-100 text-blue-800">{mockStats.team.totalWorkers}</Badge>
              </div>
            </div>
          </div>

          {/* PNG Employment Context */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
            <div className="text-xs text-green-800">
              <div className="font-medium mb-1">🇵🇬 Local Employment</div>
              <div className="text-green-700">
                Supporting PNG communities with infrastructure jobs and skills development
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline & Budget */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline & Budget
          </CardTitle>
          <CardDescription>
            Project schedule and finances
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Timeline */}
          <div className="space-y-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Start Date</div>
              <div className="text-sm font-medium text-gray-700">
                {formatDate(mockStats.timeline.startDate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Target Completion</div>
              <div className="text-sm font-medium text-gray-700">
                {formatDate(mockStats.timeline.plannedEndDate)}
              </div>
            </div>
          </div>

          {/* Budget */}
          <div className="border-t pt-3 space-y-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Budget Status</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Allocated</span>
                <span className="font-medium">{formatCurrency(mockStats.budget.allocated)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Spent</span>
                <span className="text-blue-600">{formatCurrency(mockStats.budget.spent)}</span>
              </div>
              <Progress
                value={(mockStats.budget.spent / mockStats.budget.allocated) * 100}
                className="h-2"
              />
            </div>
          </div>

          {/* ITCFA Exxon Mobile Branding */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
            <div className="text-xs text-blue-800">
              <div className="font-medium mb-1">💼 ITCFA - Exxon Mobile</div>
              <div className="text-blue-700">
                Investing in PNG infrastructure development and local capacity building
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Key Performance Metrics
          </CardTitle>
          <CardDescription>
            Real-time construction progress indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* GPS Points Recorded */}
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <MapPin className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-800">157</div>
              <div className="text-xs text-blue-600">GPS Points</div>
            </div>

            {/* Quality Checks */}
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-800">89%</div>
              <div className="text-xs text-green-600">Quality Score</div>
            </div>

            {/* Days Remaining */}
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <Clock className="h-6 w-6 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-800">298</div>
              <div className="text-xs text-orange-600">Days Left</div>
            </div>

            {/* Safety Record */}
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <AlertCircle className="h-6 w-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-800">0</div>
              <div className="text-xs text-purple-600">Incidents</div>
            </div>
          </div>

          {/* PNG Connect Program Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-4 h-3 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded-sm"></div>
                <span>Connect PNG Program</span>
              </div>
              <span>Real-time monitoring system</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Notice */}
      <Card className="lg:col-span-2">
        <CardContent className="pt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-yellow-800 mb-1">
                  Development Status
                </div>
                <div className="text-xs text-yellow-700 space-y-1">
                  <div>📊 Statistical data will be populated from real project data</div>
                  <div>📈 Real-time metrics integration in development</div>
                  <div>🔄 Live updates via Server-Sent Events ready</div>
                  <div>📱 Mobile-responsive dashboard optimization pending</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
