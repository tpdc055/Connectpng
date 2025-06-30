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
import { Switch } from "@/components/ui/switch";
import {
  Plus, Edit, Save, Search, Filter, CheckCircle, XCircle, AlertTriangle,
  FileText, Beaker, ClipboardCheck, Calendar, Camera, FileCheck,
  TrendingUp, BarChart3, Target, Settings, Upload, Download
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  projectCode: string;
  province: string;
}

interface ProjectSection {
  id: string;
  sectionName: string;
  startKm: number;
  endKm: number;
  length: number;
}

interface QualityReport {
  id: string;
  reportType: string;
  testDate: string;
  materialType?: string;
  testResults: Record<string, any>;
  specCompliance: string;
  environmentalCompliance: string;
  socialCompliance: string;
  qaQcStatus: string;
  deficiencies: string[];
  correctiveActions: string[];
  inspectionFindings?: string;
  recommendations?: string;
  followUpRequired: boolean;
  followUpDate?: string;
  testCertificates: string[];
  photos: string[];
  documents: string[];
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
    position?: string;
  };
  createdAt: string;
}

interface QualityStats {
  total: number;
  passed: number;
  failed: number;
  conditionalPass: number;
  reworkRequired: number;
  passRate: number;
  complianceBreakdown: {
    compliant: number;
    nonCompliant: number;
    pending: number;
    rework: number;
  };
  typeBreakdown: Record<string, number>;
}

interface QualityComplianceTrackerProps {
  projectId: string;
}

export function QualityComplianceTracker({ projectId }: QualityComplianceTrackerProps) {
  const [reports, setReports] = useState<QualityReport[]>([]);
  const [stats, setStats] = useState<QualityStats | null>(null);
  const [sections, setSections] = useState<ProjectSection[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<QualityReport | null>(null);
  const [selectedType, setSelectedType] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    sectionId: '',
    reportType: 'MATERIAL_TESTING',
    testDate: new Date().toISOString().split('T')[0],
    materialType: '',
    testResults: '',
    specCompliance: 'PENDING',
    environmentalCompliance: 'PENDING',
    socialCompliance: 'PENDING',
    qaQcStatus: 'PASS',
    deficiencies: '',
    correctiveActions: '',
    inspectionFindings: '',
    recommendations: '',
    followUpRequired: false,
    followUpDate: '',
    testCertificates: '',
    documents: ''
  });

  // Quality report types and statuses
  const reportTypes = [
    { value: 'MATERIAL_TESTING', label: 'Material Testing', icon: Beaker, color: 'bg-blue-500' },
    { value: 'SPECIFICATION_COMPLIANCE', label: 'Specification Compliance', icon: ClipboardCheck, color: 'bg-green-500' },
    { value: 'ENVIRONMENTAL_COMPLIANCE', label: 'Environmental Compliance', icon: Target, color: 'bg-emerald-500' },
    { value: 'SOCIAL_COMPLIANCE', label: 'Social Compliance', icon: Settings, color: 'bg-purple-500' },
    { value: 'QA_QC_INSPECTION', label: 'QA/QC Inspection', icon: Search, color: 'bg-orange-500' },
    { value: 'AUDIT_REPORT', label: 'Audit Report', icon: FileCheck, color: 'bg-red-500' }
  ];

  const complianceStatuses = [
    { value: 'COMPLIANT', label: 'Compliant', color: 'bg-green-500 text-white', icon: CheckCircle },
    { value: 'NON_COMPLIANT', label: 'Non-Compliant', color: 'bg-red-500 text-white', icon: XCircle },
    { value: 'PENDING', label: 'Pending Review', color: 'bg-yellow-500 text-white', icon: AlertTriangle },
    { value: 'REWORK_NEEDED', label: 'Rework Needed', color: 'bg-orange-500 text-white', icon: Settings }
  ];

  const qaQcStatuses = [
    { value: 'PASS', label: 'Pass', color: 'bg-green-500 text-white', icon: CheckCircle },
    { value: 'FAIL', label: 'Fail', color: 'bg-red-500 text-white', icon: XCircle },
    { value: 'CONDITIONAL_PASS', label: 'Conditional Pass', color: 'bg-yellow-500 text-white', icon: AlertTriangle },
    { value: 'REWORK_REQUIRED', label: 'Rework Required', color: 'bg-orange-500 text-white', icon: Settings }
  ];

  const materialTypes = [
    'Aggregates', 'Asphalt', 'Concrete', 'Steel', 'Bitumen', 'Cement',
    'Sand', 'Gravel', 'Stone', 'Geotextile', 'Drainage Materials', 'Other'
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

      // Fetch project details and quality reports
      const [projectResponse, reportsResponse] = await Promise.all([
        fetch(`/api/projects/${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/quality-reports?projectId=${projectId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (projectResponse.ok) {
        const projectData = await projectResponse.json();
        setProject(projectData.project);
        setSections(projectData.project?.sections || []);
      }

      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setReports(reportsData.qualityReports || []);
        setStats(reportsData.stats);
      }

    } catch (error) {
      console.error('Error fetching quality reports:', error);
      setMessage({ type: 'error', text: 'Failed to load quality data' });
    } finally {
      setLoading(false);
    }
  };

  const saveReport = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('auth_token');

      // Parse test results JSON
      let testResultsObj = {};
      if (formData.testResults.trim()) {
        try {
          testResultsObj = JSON.parse(formData.testResults);
        } catch {
          // If not valid JSON, create simple key-value object
          testResultsObj = { description: formData.testResults };
        }
      }

      const reportData = {
        projectId,
        sectionId: formData.sectionId || null,
        reportType: formData.reportType,
        testDate: formData.testDate,
        materialType: formData.materialType || null,
        testResults: testResultsObj,
        specCompliance: formData.specCompliance,
        environmentalCompliance: formData.environmentalCompliance,
        socialCompliance: formData.socialCompliance,
        qaQcStatus: formData.qaQcStatus,
        deficiencies: formData.deficiencies ? formData.deficiencies.split('\n').filter(d => d.trim()) : [],
        correctiveActions: formData.correctiveActions ? formData.correctiveActions.split('\n').filter(a => a.trim()) : [],
        inspectionFindings: formData.inspectionFindings || null,
        recommendations: formData.recommendations || null,
        followUpRequired: formData.followUpRequired,
        followUpDate: formData.followUpDate || null,
        testCertificates: formData.testCertificates ? formData.testCertificates.split('\n').filter(c => c.trim()) : [],
        documents: formData.documents ? formData.documents.split('\n').filter(d => d.trim()) : []
      };

      const url = `/api/quality-reports`;
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
        const result = await response.json();
        setMessage({
          type: 'success',
          text: editingReport
            ? 'Quality report updated successfully!'
            : `Quality report created successfully!${result.followUpScheduled ? ' Follow-up scheduled.' : ''}`
        });
        await fetchAllData();
        setIsDialogOpen(false);
        resetForm();
      } else {
        const error = await response.text();
        setMessage({ type: 'error', text: `Failed to save report: ${error}` });
      }
    } catch (error) {
      console.error('Error saving quality report:', error);
      setMessage({ type: 'error', text: 'Failed to save quality report' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingReport(null);
    setFormData({
      sectionId: '',
      reportType: 'MATERIAL_TESTING',
      testDate: new Date().toISOString().split('T')[0],
      materialType: '',
      testResults: '',
      specCompliance: 'PENDING',
      environmentalCompliance: 'PENDING',
      socialCompliance: 'PENDING',
      qaQcStatus: 'PASS',
      deficiencies: '',
      correctiveActions: '',
      inspectionFindings: '',
      recommendations: '',
      followUpRequired: false,
      followUpDate: '',
      testCertificates: '',
      documents: ''
    });
  };

  const getReportTypeConfig = (type: string) => {
    return reportTypes.find(t => t.value === type) || reportTypes[0];
  };

  const getComplianceConfig = (status: string) => {
    return complianceStatuses.find(s => s.value === status) || complianceStatuses[2];
  };

  const getQaQcConfig = (status: string) => {
    return qaQcStatuses.find(s => s.value === status) || qaQcStatuses[0];
  };

  const filteredReports = reports.filter(report => {
    const matchesType = selectedType === "all" || report.reportType === selectedType;
    const matchesStatus = selectedStatus === "all" || report.qaQcStatus === selectedStatus;
    const matchesSearch = searchTerm === "" ||
      report.materialType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.inspectionFindings?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportType.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesStatus && matchesSearch;
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p>Loading quality reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-green-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quality Compliance Tracker</h2>
            <p className="text-gray-600">
              Material Testing & Standards Compliance - {project?.name} ({project?.projectCode})
            </p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={resetForm}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Quality Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Beaker className="h-5 w-5 text-green-600" />
                {editingReport ? 'Update Quality Report' : 'Create Quality Report'}
              </DialogTitle>
              <DialogDescription>
                Record material testing results and compliance assessments
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="testing" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="testing">Testing & Materials</TabsTrigger>
                <TabsTrigger value="compliance">Compliance Assessment</TabsTrigger>
                <TabsTrigger value="documentation">Documentation</TabsTrigger>
              </TabsList>

              <TabsContent value="testing" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reportType">Report Type</Label>
                    <Select value={formData.reportType} onValueChange={(value) => setFormData(prev => ({ ...prev, reportType: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {reportTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="testDate">Test Date</Label>
                    <Input
                      id="testDate"
                      type="date"
                      value={formData.testDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, testDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="materialType">Material Type</Label>
                    <Select value={formData.materialType} onValueChange={(value) => setFormData(prev => ({ ...prev, materialType: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select material type" />
                      </SelectTrigger>
                      <SelectContent>
                        {materialTypes.map(material => (
                          <SelectItem key={material} value={material}>
                            {material}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="qaQcStatus">QA/QC Status</Label>
                    <Select value={formData.qaQcStatus} onValueChange={(value) => setFormData(prev => ({ ...prev, qaQcStatus: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {qaQcStatuses.map(status => (
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
                </div>

                <div>
                  <Label htmlFor="testResults">Test Results (JSON format or description)</Label>
                  <Textarea
                    id="testResults"
                    value={formData.testResults}
                    onChange={(e) => setFormData(prev => ({ ...prev, testResults: e.target.value }))}
                    placeholder='{"compressiveStrength": "25 MPa", "density": "2.4 g/cm³", "slump": "75mm"} or plain text description'
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="inspectionFindings">Inspection Findings</Label>
                  <Textarea
                    id="inspectionFindings"
                    value={formData.inspectionFindings}
                    onChange={(e) => setFormData(prev => ({ ...prev, inspectionFindings: e.target.value }))}
                    placeholder="Detailed inspection observations and findings"
                    rows={3}
                  />
                </div>
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="specCompliance">Specification Compliance</Label>
                    <Select value={formData.specCompliance} onValueChange={(value) => setFormData(prev => ({ ...prev, specCompliance: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {complianceStatuses.map(status => (
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

                  <div>
                    <Label htmlFor="environmentalCompliance">Environmental Compliance</Label>
                    <Select value={formData.environmentalCompliance} onValueChange={(value) => setFormData(prev => ({ ...prev, environmentalCompliance: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {complianceStatuses.map(status => (
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

                  <div>
                    <Label htmlFor="socialCompliance">Social Compliance</Label>
                    <Select value={formData.socialCompliance} onValueChange={(value) => setFormData(prev => ({ ...prev, socialCompliance: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {complianceStatuses.map(status => (
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
                </div>

                <div>
                  <Label htmlFor="deficiencies">Deficiencies Found (one per line)</Label>
                  <Textarea
                    id="deficiencies"
                    value={formData.deficiencies}
                    onChange={(e) => setFormData(prev => ({ ...prev, deficiencies: e.target.value }))}
                    placeholder="Material strength below specification&#10;Surface finish does not meet standards&#10;Dimensional tolerance exceeded"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="correctiveActions">Corrective Actions (one per line)</Label>
                  <Textarea
                    id="correctiveActions"
                    value={formData.correctiveActions}
                    onChange={(e) => setFormData(prev => ({ ...prev, correctiveActions: e.target.value }))}
                    placeholder="Retest material with adjusted mix design&#10;Rework surface finishing&#10;Re-measure and correct dimensions"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="recommendations">Recommendations</Label>
                  <Textarea
                    id="recommendations"
                    value={formData.recommendations}
                    onChange={(e) => setFormData(prev => ({ ...prev, recommendations: e.target.value }))}
                    placeholder="Recommendations for future work or improvements"
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="followUpRequired"
                    checked={formData.followUpRequired}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, followUpRequired: checked }))}
                  />
                  <Label htmlFor="followUpRequired">Follow-up required</Label>
                </div>

                {formData.followUpRequired && (
                  <div>
                    <Label htmlFor="followUpDate">Follow-up Date</Label>
                    <Input
                      id="followUpDate"
                      type="date"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documentation" className="space-y-4">
                <div>
                  <Label htmlFor="testCertificates">Test Certificates (URLs, one per line)</Label>
                  <Textarea
                    id="testCertificates"
                    value={formData.testCertificates}
                    onChange={(e) => setFormData(prev => ({ ...prev, testCertificates: e.target.value }))}
                    placeholder="https://example.com/certificate1.pdf&#10;https://example.com/certificate2.pdf"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="documents">Supporting Documents (URLs, one per line)</Label>
                  <Textarea
                    id="documents"
                    value={formData.documents}
                    onChange={(e) => setFormData(prev => ({ ...prev, documents: e.target.value }))}
                    placeholder="https://example.com/test-report.pdf&#10;https://example.com/inspection-photos.zip"
                    rows={3}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={saveReport}
                disabled={saving || !formData.reportType}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? 'Saving...' : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingReport ? 'Update Report' : 'Create Report'}
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

      {/* Quality Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Beaker className="h-5 w-5 text-gray-600" />
                <div>
                  <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
                  <div className="text-sm text-gray-600">Total Reports</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
                  <div className="text-sm text-gray-600">Passed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{stats.conditionalPass}</div>
                  <div className="text-sm text-gray-600">Conditional</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">{stats.reworkRequired}</div>
                  <div className="text-sm text-gray-600">Rework</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">{stats.passRate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Pass Rate</div>
                </div>
              </div>
              <Progress value={stats.passRate} className="h-1 mt-2" />
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

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Report Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Report Types</SelectItem>
                {reportTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {qaQcStatuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-green-600" />
            Quality Reports ({filteredReports.length})
          </CardTitle>
          <CardDescription>
            Material testing and compliance reports for {project?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <Beaker className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {reports.length === 0 ? 'No Quality Reports' : 'No Matching Reports'}
              </h3>
              <p className="text-gray-600 mb-4">
                {reports.length === 0
                  ? 'Start by creating your first quality report to track material testing and compliance.'
                  : 'No reports match your current filters.'
                }
              </p>
              {reports.length === 0 && (
                <Button onClick={() => setIsDialogOpen(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Report
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => {
                const typeConfig = getReportTypeConfig(report.reportType);
                const qaQcConfig = getQaQcConfig(report.qaQcStatus);
                const specConfig = getComplianceConfig(report.specCompliance);

                return (
                  <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <typeConfig.icon className="h-5 w-5" />
                          <h4 className="font-semibold text-lg">{typeConfig.label}</h4>
                          <Badge className={qaQcConfig.color}>
                            <qaQcConfig.icon className="h-3 w-3 mr-1" />
                            {qaQcConfig.label}
                          </Badge>
                          <Badge className={specConfig.color}>
                            <specConfig.icon className="h-3 w-3 mr-1" />
                            {specConfig.label}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div>
                            <div className="text-sm font-medium text-gray-700">Test Date & Material</div>
                            <div className="text-sm">
                              <div>{new Date(report.testDate).toLocaleDateString()}</div>
                              <div>{report.materialType || 'Not specified'}</div>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700">Tested By</div>
                            <div className="text-sm">
                              <div>{report.user.name}</div>
                              <div className="text-gray-600">{report.user.position || report.user.role}</div>
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-700">Follow-up</div>
                            <div className="text-sm">
                              {report.followUpRequired ? (
                                <div className="text-orange-600">
                                  Required: {report.followUpDate ? new Date(report.followUpDate).toLocaleDateString() : 'TBD'}
                                </div>
                              ) : (
                                <div className="text-green-600">Not required</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {report.inspectionFindings && (
                          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
                            <div className="text-sm font-medium text-blue-800">Inspection Findings:</div>
                            <div className="text-sm text-blue-700">{report.inspectionFindings}</div>
                          </div>
                        )}

                        {report.deficiencies.length > 0 && (
                          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
                            <div className="text-sm font-medium text-red-800">Deficiencies:</div>
                            <ul className="text-sm text-red-700 list-disc list-inside">
                              {report.deficiencies.slice(0, 2).map((deficiency, index) => (
                                <li key={index}>{deficiency}</li>
                              ))}
                              {report.deficiencies.length > 2 && (
                                <li className="text-blue-600">+ {report.deficiencies.length - 2} more deficiencies</li>
                              )}
                            </ul>
                          </div>
                        )}

                        {report.correctiveActions.length > 0 && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                            <div className="text-sm font-medium text-green-800">Corrective Actions:</div>
                            <ul className="text-sm text-green-700 list-disc list-inside">
                              {report.correctiveActions.slice(0, 2).map((action, index) => (
                                <li key={index}>{action}</li>
                              ))}
                              {report.correctiveActions.length > 2 && (
                                <li className="text-blue-600">+ {report.correctiveActions.length - 2} more actions</li>
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
                            setEditingReport(report);
                            setFormData({
                              sectionId: report.section?.id || '',
                              reportType: report.reportType,
                              testDate: report.testDate.split('T')[0],
                              materialType: report.materialType || '',
                              testResults: typeof report.testResults === 'object'
                                ? JSON.stringify(report.testResults, null, 2)
                                : String(report.testResults || ''),
                              specCompliance: report.specCompliance,
                              environmentalCompliance: report.environmentalCompliance,
                              socialCompliance: report.socialCompliance,
                              qaQcStatus: report.qaQcStatus,
                              deficiencies: report.deficiencies.join('\n'),
                              correctiveActions: report.correctiveActions.join('\n'),
                              inspectionFindings: report.inspectionFindings || '',
                              recommendations: report.recommendations || '',
                              followUpRequired: report.followUpRequired,
                              followUpDate: report.followUpDate?.split('T')[0] || '',
                              testCertificates: report.testCertificates.join('\n'),
                              documents: report.documents.join('\n')
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
