"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  Building,
  MapPin,
  DollarSign,
  Satellite,
  TrendingUp,
  Users,
  Clock,
  Target
} from "lucide-react";

interface ReportData {
  reportType: string;
  generatedAt: string;
  filters: {
    projectId?: string;
    startDate?: string;
    endDate?: string;
    provinceId?: string;
    contractorId?: string;
  };
  data: any;
}

interface Project {
  id: string;
  name: string;
  province?: { name: string };
}

interface Province {
  id: string;
  name: string;
  code: string;
  region: string;
}

interface Contractor {
  id: string;
  name: string;
  licenseNumber: string;
  certificationLevel: string;
}

// Token validation helper
const getValidAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

export function Reports({ projectId }: { projectId?: string }) {
  const { user } = useAuth();
  const [selectedReportType, setSelectedReportType] = useState("overview");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  // Filter states
  const [selectedProject, setSelectedProject] = useState(projectId || "all");
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [selectedContractor, setSelectedContractor] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Data for dropdowns
  const [projects, setProjects] = useState<Project[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);

  const reportTypes = [
    {
      id: "overview",
      name: "System Overview",
      description: "Complete system statistics and project summary",
      icon: BarChart3,
      color: "bg-blue-100 text-blue-800 border-blue-300"
    },
    {
      id: "progress",
      name: "Progress Report",
      description: "Construction progress and GPS activity analysis",
      icon: TrendingUp,
      color: "bg-green-100 text-green-800 border-green-300"
    },
    {
      id: "contractor",
      name: "Contractor Performance",
      description: "Contractor statistics and performance metrics",
      icon: Building,
      color: "bg-purple-100 text-purple-800 border-purple-300"
    },
    {
      id: "province",
      name: "Provincial Report",
      description: "Infrastructure development by PNG province",
      icon: MapPin,
      color: "bg-orange-100 text-orange-800 border-orange-300"
    },
    {
      id: "gps",
      name: "GPS Data Export",
      description: "Detailed GPS coordinates and location data",
      icon: Satellite,
      color: "bg-cyan-100 text-cyan-800 border-cyan-300"
    },
    {
      id: "financial",
      name: "Financial Summary",
      description: "Budget allocation and contractor payments",
      icon: DollarSign,
      color: "bg-yellow-100 text-yellow-800 border-yellow-300"
    }
  ];

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const headers = getValidAuthHeaders();

      // Fetch projects
      try {
        const projectsResponse = await fetch('/api/projects', { headers });
        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json();
          setProjects(projectsData.projects || []);
        } else if (projectsResponse.status === 401) {
          console.log('Authentication expired - please refresh login');
          setProjects([]);
        }
      } catch (err) {
        console.log('Projects API not available, using empty list');
        setProjects([]);
      }

      // Fetch provinces
      try {
        const provincesResponse = await fetch('/api/provinces', { headers });
        if (provincesResponse.ok) {
          const provincesData = await provincesResponse.json();
          setProvinces(provincesData.provinces || []);
        } else if (provincesResponse.status === 401) {
          console.log('Authentication expired - please refresh login');
          setProvinces([]);
        }
      } catch (err) {
        console.log('Provinces API not available, using empty list');
        setProvinces([]);
      }

      // Fetch contractors
      try {
        const contractorsResponse = await fetch('/api/contractors/register', { headers });
        if (contractorsResponse.ok) {
          const contractorsData = await contractorsResponse.json();
          setContractors(contractorsData.contractors || []);
        } else if (contractorsResponse.status === 401) {
          console.log('Authentication expired - please refresh login');
          setContractors([]);
        }
      } catch (err) {
        console.log('Contractors API not available, using empty list');
        setContractors([]);
      }
    } catch (error) {
      console.log('Authentication not available - limited functionality');
      // Set defaults to prevent crashes
      setProjects([]);
      setProvinces([]);
      setContractors([]);
    }
  };

  const generateReport = async () => {
    try {
      setIsGenerating(true);
      setError("");

      const headers = getValidAuthHeaders();

      const params = new URLSearchParams({
        type: selectedReportType,
        ...(selectedProject && selectedProject !== "all" && { projectId: selectedProject }),
        ...(selectedProvince && selectedProvince !== "all" && { provinceId: selectedProvince }),
        ...(selectedContractor && selectedContractor !== "all" && { contractorId: selectedContractor }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await fetch(`/api/reports?${params}`, { headers });

      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else if (response.status === 401) {
        setError('Authentication expired. Please refresh your login and try again.');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate report');
      }
    } catch (error) {
      if (error.message === 'No authentication token found') {
        setError('Please log in to generate reports');
      } else {
        setError('Error generating report - please try again');
      }
      console.error('Report generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const exportReport = (format: 'json' | 'csv') => {
    if (!reportData) return;

    const filename = `png-${reportData.reportType}-report-${new Date().toISOString().split('T')[0]}.${format}`;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Convert data to CSV based on report type
      let csvContent = generateCSV(reportData);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const generateCSV = (data: ReportData): string => {
    let csvContent = `PNG Road Construction Report - ${data.reportType}\n`;
    csvContent += `Generated: ${new Date(data.generatedAt).toLocaleString()}\n\n`;

    // Add CSV content based on report type
    switch (data.reportType) {
      case 'overview':
        csvContent += "Project,Province,Status,Progress,Contractors,GPS Points\n";
        data.data.projects?.forEach((project: any) => {
          csvContent += `"${project.name}","${project.province}","${project.status}",${project.progress}%,${project.activeContractors},${project.gpsPoints}\n`;
        });
        break;
      case 'gps':
        csvContent += "Project,Province,Latitude,Longitude,Phase,Side,Distance,Status,User,Section,Timestamp\n";
        data.data.exportData?.forEach((point: any) => {
          csvContent += `"${point.project}","${point.province}",${point.latitude},${point.longitude},"${point.phase}","${point.side}",${point.distance},"${point.status}","${point.user}","${point.section || ''}","${point.timestamp}"\n`;
        });
        break;
      default:
        csvContent += JSON.stringify(data.data, null, 2);
    }

    return csvContent;
  };

  const renderReportContent = () => {
    if (!reportData) return null;

    const { data } = reportData;

    switch (reportData.reportType) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Target className="h-8 w-8 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold text-blue-800">{data.summary?.totalProjects || 0}</div>
                      <div className="text-sm text-blue-600">Total Projects</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Building className="h-8 w-8 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold text-green-800">{data.summary?.totalContractors || 0}</div>
                      <div className="text-sm text-green-600">Active Contractors</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-8 w-8 text-purple-600" />
                    <div>
                      <div className="text-2xl font-bold text-purple-800">{data.summary?.totalProvinces || 0}</div>
                      <div className="text-sm text-purple-600">PNG Provinces</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Satellite className="h-8 w-8 text-orange-600" />
                    <div>
                      <div className="text-2xl font-bold text-orange-800">{data.summary?.totalGpsPoints || 0}</div>
                      <div className="text-sm text-orange-600">GPS Points</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Projects List */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.projects?.map((project: any) => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-gray-600">{project.province} • {project.totalSections} sections</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{project.progress.toFixed(1)}% Complete</div>
                        <Badge className="text-xs">{project.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'progress':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(data.progressByPhase || {}).map(([phase, stats]: [string, any]) => (
                <Card key={phase}>
                  <CardContent className="p-4">
                    <div className="text-lg font-semibold">{phase}</div>
                    <div className="text-2xl font-bold text-blue-800">{stats.count}</div>
                    <div className="text-sm text-gray-600">{stats.totalDistance}m total distance</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {data.recentActivity?.map((activity: any) => (
                    <div key={activity.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{activity.project}</div>
                        <div className="text-sm text-gray-600">{activity.phase} • {activity.user}</div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'contractor':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contractor Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.contractors?.map((contractor: any) => (
                    <div key={contractor.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold">{contractor.name}</div>
                          <div className="text-sm text-gray-600">
                            {contractor.licenseNumber} • Grade {contractor.certificationLevel}
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          Rating: {contractor.averageRating}/10
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="font-medium">Active Projects</div>
                          <div className="text-gray-600">{contractor.activeProjects}</div>
                        </div>
                        <div>
                          <div className="font-medium">Total Projects</div>
                          <div className="text-gray-600">{contractor.totalProjects}</div>
                        </div>
                        <div>
                          <div className="font-medium">Sections Assigned</div>
                          <div className="text-gray-600">{contractor.assignedSections}</div>
                        </div>
                        <div>
                          <div className="font-medium">Contract Value</div>
                          <div className="text-gray-600">K {contractor.totalContractValue?.toLocaleString() || 0}</div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="text-sm font-medium mb-2">Specializations:</div>
                        <div className="flex flex-wrap gap-1">
                          {contractor.specializations?.map((spec: string) => (
                            <Badge key={spec} variant="outline" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'financial':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-lg font-semibold">Total Contract Value</div>
                  <div className="text-2xl font-bold text-green-800">
                    K {data.overview?.totalContractValue?.toLocaleString() || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-lg font-semibold">Budget Allocated</div>
                  <div className="text-2xl font-bold text-blue-800">
                    K {data.overview?.totalBudgetAllocated?.toLocaleString() || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-lg font-semibold">Budget Spent</div>
                  <div className="text-2xl font-bold text-orange-800">
                    K {data.overview?.totalBudgetSpent?.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    {data.overview?.budgetUtilization?.toFixed(1) || 0}% utilized
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Section Budget Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {data.sectionBreakdown?.map((section: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <div className="font-medium">{section.section}</div>
                        <div className="text-sm text-gray-600">
                          {section.project} • {section.contractor || 'No contractor assigned'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">K {section.budgetAllocated?.toLocaleString() || 0}</div>
                        <div className="text-sm text-gray-600">
                          {section.utilization?.toFixed(1) || 0}% spent
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <Card>
            <CardContent className="p-6">
              <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto max-h-96">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-50 to-red-50 border-2 border-yellow-400 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-6 bg-gradient-to-r from-red-600 via-black to-yellow-400 rounded shadow-sm"></div>
          <h2 className="text-2xl font-bold text-gray-900">PNG Connect Reports</h2>
          <Badge variant="outline" className="bg-yellow-100 border-yellow-500 text-yellow-800">
            Analytics & Reporting
          </Badge>
        </div>
        <p className="text-gray-700">Generate comprehensive reports for PNG road construction projects</p>
      </div>

      {/* Report Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select Report Type
          </CardTitle>
          <CardDescription>
            Choose the type of report you want to generate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map((report) => (
              <div
                key={report.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedReportType === report.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedReportType(report.id)}
              >
                <div className="flex items-center gap-3 mb-2">
                  <report.icon className="h-6 w-6 text-gray-700" />
                  <h3 className="font-semibold">{report.name}</h3>
                </div>
                <p className="text-sm text-gray-600">{report.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="project">Project</Label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="All projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="province">Province</Label>
              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                <SelectTrigger>
                  <SelectValue placeholder="All provinces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All provinces</SelectItem>
                  {provinces.map((province) => (
                    <SelectItem key={province.id} value={province.id}>
                      {province.name} ({province.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="contractor">Contractor</Label>
              <Select value={selectedContractor} onValueChange={setSelectedContractor}>
                <SelectTrigger>
                  <SelectValue placeholder="All contractors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All contractors</SelectItem>
                  {contractors.map((contractor) => (
                    <SelectItem key={contractor.id} value={contractor.id}>
                      {contractor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <Button
              onClick={generateReport}
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>

            {reportData && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => exportReport('json')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportReport('csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="text-red-800 font-medium">Error generating report:</div>
            <div className="text-red-700">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Report Results */}
      {reportData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {reportTypes.find(r => r.id === reportData.reportType)?.name || 'Report'}
                </CardTitle>
                <CardDescription>
                  Generated on {new Date(reportData.generatedAt).toLocaleString()}
                </CardDescription>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-300">
                Report Ready
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {renderReportContent()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
