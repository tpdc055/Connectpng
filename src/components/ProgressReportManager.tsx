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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Edit, Save, Trash2, FileText, TrendingUp, TrendingDown,
  Calendar, Camera, MapPin, AlertTriangle, CheckCircle, Clock,
  BarChart3, Activity, Users, Shield, Leaf, DollarSign
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  projectCode: string;
  province: string;
  totalLength: number;
}

interface ProjectSection {
  id: string;
  sectionName: string;
  startKm: number;
  endKm: number;
  length: number;
  actualProgress: number;
  status: string;
}

interface ProgressReport {
  id: string;
  reportType: string;
  reportDate: string;
  currentProgress: number;
  previousProgress: number;
  progressDelta: number;
  plannedProgress: number;
  scheduleStatus: string;
  worksCompleted: string[];
  delayReason?: string;
  weatherConditions?: string;
  siteConditions?: string;
  notes?: string;
  beforePhotos: string[];
  duringPhotos: string[];
  afterPhotos: string[];
  project: {
    name: string;
    projectCode: string;
  };
  section?: {
    sectionName: string;
    startKm: number;
    endKm: number;
  };
  user: {
    name: string;
    role: string;
  };
  createdAt: string;
}

interface ProgressReportManagerProps {
  projectId: string;
}

export function ProgressReportManager({ projectId }: ProgressReportManagerProps) {
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [sections, setSections] = useState<ProjectSection[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ProgressReport | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    sectionId: '',
    reportType: 'WEEKLY',
    reportDate: new Date().toISOString().split('T')[0],
    currentProgress: '',
    plannedProgress: '',
    worksCompleted: '',
    delayReason: '',
    weatherConditions: '',
    siteConditions: '',
    notes: ''
  });

  useEffect(() => {
    if (projectId) {
      fetchAllData();
    }
  }, [projectId]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      // Fetch project details and reports
      const [projectResponse, reportsResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/progress-reports?projectId=${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData.project);
        setSections(projectData.project?.roadSections || []);
      }

      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData.progressReports || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load project data' });
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');

      // Get previous progress for delta calculation
      const previousProgress = editingReport ? editingReport.previousProgress :
        reports.length > 0 ? reports[0].currentProgress : 0;

      const reportData = {
        projectId,
        sectionId: formData.sectionId || null,
        reportType: formData.reportType,
        reportDate: formData.reportDate,
        previousProgress,
        currentProgress: parseFloat(formData.currentProgress),
        plannedProgress: parseFloat(formData.plannedProgress) || parseFloat(formData.currentProgress),
        worksCompleted: formData.worksCompleted.split('\n').filter(work => work.trim()),
        delayReason: formData.delayReason || null,
        weatherConditions: formData.weatherConditions || null,
        siteConditions: formData.siteConditions || null,
        notes: formData.notes || null
      };

      const url = `/api/progress-reports`;
      const method = editingReport ? 'PUT' : 'POST';

      if (editingReport) {
        (reportData as any).id = editingReport.id;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportData)
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: editingReport ? 'Progress report updated successfully!' : 'Progress report created successfully!'
        });
        await fetchAllData();
        setIsDialogOpen(false);
        resetForm();
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: `Failed to save report: ${error}` });
      }
    } catch (error) {
      console.error('Error saving report:', error);
      setMessage({ type: 'error', text: 'Failed to save progress report' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingReport(null);
    setFormData({
      sectionId: '',
      reportType: 'WEEKLY',
      reportDate: new Date().toISOString().split('T')[0],
      currentProgress: '',
      plannedProgress: '',
      worksCompleted: '',
      delayReason: '',
      weatherConditions: '',
      siteConditions: '',
      notes: ''
    });
  };

  const getScheduleStatusColor = (status: string) => {
    switch (status) {
      case 'ON_TRACK': return 'bg-green-500 text-white';
      case 'BEHIND': return 'bg-red-500 text-white';
      case 'AHEAD': return 'bg-blue-500 text-white';
      case 'CRITICAL_DELAY': return 'bg-purple-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const calculateOverallProgress = () => {
    if (sections.length === 0) return 0;
    const totalLength = sections.reduce((sum, section) => sum + section.length, 0);
    const weightedProgress = sections.reduce((sum, section) =>
      sum + (section.actualProgress * section.length), 0);
    return totalLength > 0 ? Math.round(weightedProgress / totalLength) : 0;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading progress reports...</p>
      </div>
    );
  }

  const overallProgress = calculateOverallProgress();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Progress Monitoring</h2>
            <p className="text-gray-600">
              {project?.name} ({project?.projectCode})
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Progress Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingReport ? 'Edit Progress Report' : 'Create Progress Report'}
              </DialogTitle>
              <DialogDescription>
                Record construction progress for project monitoring
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select value={formData.reportType} onValueChange={(value) => setFormData(prev => ({ ...prev, reportType: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DAILY">Daily Report</SelectItem>
                      <SelectItem value="WEEKLY">Weekly Report</SelectItem>
                      <SelectItem value="MONTHLY">Monthly Report</SelectItem>
                      <SelectItem value="QUARTERLY">Quarterly Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reportDate">Report Date</Label>
                  <Input
                    id="reportDate"
                    type="date"
                    value={formData.reportDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, reportDate: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="currentProgress">Current Progress (%)</Label>
                  <Input
                    id="currentProgress"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.currentProgress}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentProgress: e.target.value }))}
                    placeholder="0.0"
                  />
                </div>

                <div>
                  <Label htmlFor="plannedProgress">Planned Progress (%)</Label>
                  <Input
                    id="plannedProgress"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.plannedProgress}
                    onChange={(e) => setFormData(prev => ({ ...prev, plannedProgress: e.target.value }))}
                    placeholder="0.0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="worksCompleted">Works Completed (one per line)</Label>
                <Textarea
                  id="worksCompleted"
                  value={formData.worksCompleted}
                  onChange={(e) => setFormData(prev => ({ ...prev, worksCompleted: e.target.value }))}
                  placeholder="Clearing and grubbing completed&#10;Earthworks - Cut and fill operations&#10;Culvert installation"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weatherConditions">Weather Conditions</Label>
                  <Input
                    id="weatherConditions"
                    value={formData.weatherConditions}
                    onChange={(e) => setFormData(prev => ({ ...prev, weatherConditions: e.target.value }))}
                    placeholder="Sunny, rainy, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="siteConditions">Site Conditions</Label>
                  <Input
                    id="siteConditions"
                    value={formData.siteConditions}
                    onChange={(e) => setFormData(prev => ({ ...prev, siteConditions: e.target.value }))}
                    placeholder="Good, muddy, etc."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="delayReason">Delay Reasons (if any)</Label>
                <Textarea
                  id="delayReason"
                  value={formData.delayReason}
                  onChange={(e) => setFormData(prev => ({ ...prev, delayReason: e.target.value }))}
                  placeholder="Equipment breakdown, material delays, etc."
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional observations"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={saveReport}
                disabled={saving || !formData.currentProgress}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? 'Saving...' : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingReport ? 'Update Report' : 'Save Report'}
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

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Overall Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-blue-600">{overallProgress}%</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-800">
                  {project?.totalLength}km Total
                </Badge>
              </div>
              <Progress value={overallProgress} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reports.length}
            </div>
            <div className="text-sm text-gray-600">Total reports filed</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              Schedule Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length > 0 ? (
              <Badge className={getScheduleStatusColor(reports[0].scheduleStatus)}>
                {reports[0].scheduleStatus.replace('_', ' ')}
              </Badge>
            ) : (
              <div className="text-gray-500 text-sm">No reports yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Progress Reports
          </CardTitle>
          <CardDescription>
            Construction progress tracking and monitoring
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Progress Reports</h3>
              <p className="text-gray-600 mb-4">Create your first progress report to start monitoring.</p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Create First Report
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline">{report.reportType}</Badge>
                        <Badge className={getScheduleStatusColor(report.scheduleStatus)}>
                          {report.scheduleStatus.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {new Date(report.reportDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <div className="text-sm font-medium">Progress</div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-blue-600">
                              {report.currentProgress}%
                            </span>
                            {report.progressDelta !== 0 && (
                              <span className={`text-sm flex items-center gap-1 ${
                                report.progressDelta > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {report.progressDelta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                {Math.abs(report.progressDelta)}%
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium">Reported By</div>
                          <div className="text-sm text-gray-600">
                            {report.user.name}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium">Works Completed</div>
                          <div className="text-sm text-gray-600">
                            {report.worksCompleted.length} items
                          </div>
                        </div>
                      </div>

                      {report.worksCompleted.length > 0 && (
                        <div className="mb-3">
                          <div className="text-sm font-medium text-gray-700 mb-1">Activities</div>
                          <div className="text-sm text-gray-600">
                            {report.worksCompleted.slice(0, 2).map((work, index) => (
                              <div key={index}>• {work}</div>
                            ))}
                            {report.worksCompleted.length > 2 && (
                              <div className="text-blue-600">+ {report.worksCompleted.length - 2} more...</div>
                            )}
                          </div>
                        </div>
                      )}

                      {report.delayReason && (
                        <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                          <div className="font-medium text-orange-800">Delay Reason:</div>
                          <div className="text-orange-700">{report.delayReason}</div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingReport(report);
                          setFormData({
                            sectionId: '',
                            reportType: report.reportType,
                            reportDate: report.reportDate.split('T')[0],
                            currentProgress: report.currentProgress.toString(),
                            plannedProgress: report.plannedProgress.toString(),
                            worksCompleted: report.worksCompleted.join('\n'),
                            delayReason: report.delayReason || '',
                            weatherConditions: report.weatherConditions || '',
                            siteConditions: report.siteConditions || '',
                            notes: report.notes || ''
                          });
                          setIsDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
